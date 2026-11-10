import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { loginUser } from '../services/auth.service';
import { env } from '../config/env';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { Shift } from '../models/Shift';
import { Plan } from '../models/Plan';
import type { AuthUser } from '@atlas/shared';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Owner name is required').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  libraryName: z.string().min(2, 'Library name is required').trim(),
  city: z.string().optional(),
  phone: z.string().min(10, 'Valid contact number is required').trim(),
});

// Cookie name used throughout the auth flow
export const AUTH_COOKIE = 'atlas_token';

// Shared cookie options
const cookieOptions = {
  httpOnly: true,
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'strict') as 'none' | 'strict',
  secure: env.NODE_ENV === 'production',
  // 24 h in milliseconds (mirrors JWT_EXPIRES_IN default)
  maxAge: 24 * 60 * 60 * 1000,
};

function generateToken(user: AuthUser): string {
  // Strip any jwt metadata properties if spread from decoded token
  const payload: AuthUser = {
    userId: user.userId,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantName: user.tenantName,
    phone: user.phone,
    city: user.city,
    address: user.address,
    onboardingStep: user.onboardingStep,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionTier: user.subscriptionTier,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    maxSeats: user.maxSeats,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * POST /api/v1/auth/register
 * Self-service onboarding for new library owners.
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, password, libraryName, city, phone } = parsed.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    // Generate unique slug
    let baseSlug = libraryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!baseSlug) baseSlug = 'library';
    let slug = baseSlug;
    let counter = 1;
    while (await Tenant.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Create Tenant
    const tenant = await Tenant.create({
      name: libraryName,
      slug,
      email,
      phone,
      city,
      isActive: true,
      onboardingStep: 'config',
      subscriptionStatus: 'pending_payment',
      maxSeats: 50,
    });

    // Create Owner User
    const user = await User.create({
      tenantId: tenant._id,
      name,
      email,
      passwordHash: password, // pre-save hook hashes it
      role: 'owner',
      isActive: true,
    });

    const payload: AuthUser = {
      userId: user._id.toString(),
      tenantId: tenant._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      tenantName: tenant.name,
      onboardingStep: tenant.onboardingStep,
      subscriptionStatus: tenant.subscriptionStatus,
      subscriptionTier: tenant.subscriptionTier,
      maxSeats: tenant.maxSeats,
      isActive: tenant.isActive,
    };

    const token = generateToken(payload);
    res.cookie(AUTH_COOKIE, token, cookieOptions);
    res.status(201).json({ user: payload });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/configure-library
 * Step 2: Configure library study hours, capacity, and auto-seed starter shifts/plans.
 */
export async function configureLibrary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { capacity = 50, defaultShifts = true } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    tenant.maxSeats = Math.max(10, parseInt(capacity, 10) || 50);
    tenant.onboardingStep = 'subscription';
    await tenant.save();

    // Auto-seed default shifts if none exist
    if (defaultShifts) {
      const existingMorning = await Shift.findOne({ tenantId, name: 'Morning Shift' });
      const morning = existingMorning || (await Shift.create({
        tenantId,
        name: 'Morning Shift',
        startTime: '07:00',
        endTime: '15:00',
        isActive: true,
      }));

      const existingEvening = await Shift.findOne({ tenantId, name: 'Evening Shift' });
      const evening = existingEvening || (await Shift.create({
        tenantId,
        name: 'Evening Shift',
        startTime: '15:00',
        endTime: '23:00',
        isActive: true,
      }));

      // Default plans if none exist
      const existingPlan1 = await Plan.findOne({ tenantId, name: 'Full Day Reserved' });
      if (!existingPlan1) {
        await Plan.create({
          tenantId,
          name: 'Full Day Reserved',
          seatType: 'reserved',
          shiftIds: [morning._id, evening._id],
          feePaise: 60000,
          description: 'All-day reserved desk with locker space',
        });
      }

      const existingPlan2 = await Plan.findOne({ tenantId, name: 'Morning Shift Dedicated' });
      if (!existingPlan2) {
        await Plan.create({
          tenantId,
          name: 'Morning Shift Dedicated',
          seatType: 'reserved',
          shiftIds: [morning._id],
          feePaise: 40000,
          description: 'Morning study hours reserved seat',
        });
      }
    }

    const updatedPayload: AuthUser = {
      ...req.user!,
      onboardingStep: 'subscription',
      maxSeats: tenant.maxSeats,
    };

    const token = generateToken(updatedPayload);
    res.cookie(AUTH_COOKIE, token, cookieOptions);
    res.status(200).json({ user: updatedPayload, message: 'Library configured successfully' });
  } catch (err: any) {
    console.error('Error in configureLibrary:', err);
    next(err);
  }
}

/**
 * POST /api/v1/auth/submit-payment
 * Library owner submits 12-digit UPI UTR reference for verification.
 */
export async function submitPaymentUtr(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { tier = 'growth', utr } = req.body;

    if (!utr || typeof utr !== 'string' || utr.trim().length < 6) {
      res.status(400).json({ error: 'Please enter a valid 12-digit UPI reference / UTR number' });
      return;
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const chosenTier = String(tier).trim();

    tenant.subscriptionTier = chosenTier;
    tenant.subscriptionStatus = 'pending_approval';
    tenant.lastUtrRef = utr.trim();
    tenant.lastPaymentSubmittedAt = new Date();
    await tenant.save();

    const updatedPayload: AuthUser = {
      ...req.user!,
      subscriptionStatus: 'pending_approval',
      subscriptionTier: chosenTier,
      isActive: tenant.isActive,
    };

    const token = generateToken(updatedPayload);
    res.cookie(AUTH_COOKIE, token, cookieOptions);
    res.status(200).json({
      user: updatedPayload,
      message: 'Payment reference submitted successfully! Super-admin will verify and activate your library shortly.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/login
 * Validates credentials, sets httpOnly auth cookie on success.
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parsed.data;
    const { token, user } = await loginUser(email, password);

    res.cookie(AUTH_COOKIE, token, cookieOptions);
    res.status(200).json({ user });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('suspended') || err.message.includes('disabled')) {
        res.status(403).json({ error: err.message });
        return;
      }
      if (err.message === 'Invalid email or password') {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
    }
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 * Clears the auth cookie.
 */
export function logout(_req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: (env.NODE_ENV === 'production' ? 'none' : 'strict') as 'none' | 'strict',
    secure: env.NODE_ENV === 'production',
  });
  res.status(200).json({ message: 'Logged out successfully' });
}

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user (set by authenticate middleware).
 * Re-reads Tenant state from DB to guarantee live subscriptionStatus.
 */
export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    // Superadmin has no tenant
    if (req.user.role === 'superadmin' || !req.user.tenantId) {
      res.status(200).json({ user: req.user });
      return;
    }

    // Always fetch latest tenant status from database
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Library not found' });
      return;
    }

    const latestUser: AuthUser = {
      ...req.user,
      tenantName: tenant.name,
      phone: tenant.phone,
      city: tenant.city,
      address: tenant.address,
      subscriptionStatus: tenant.subscriptionStatus,
      subscriptionTier: tenant.subscriptionTier,
      subscriptionExpiresAt: tenant.subscriptionExpiresAt ? tenant.subscriptionExpiresAt.toISOString() : undefined,
      onboardingStep: tenant.onboardingStep,
      maxSeats: tenant.maxSeats,
      isActive: tenant.isActive,
    };

    // If tenant status or active state changed in DB (e.g. approved or suspended by superadmin), re-issue updated cookie
    if (
      tenant.subscriptionStatus !== req.user.subscriptionStatus ||
      tenant.onboardingStep !== req.user.onboardingStep ||
      tenant.isActive !== req.user.isActive
    ) {
      const token = generateToken(latestUser);
      res.cookie(AUTH_COOKIE, token, cookieOptions);
    }

    res.status(200).json({ user: latestUser });
  } catch (err) {
    next(err);
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  otp: z.string().min(4, 'OTP is required').trim(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * POST /api/v1/auth/forgot-password
 * Generates a 6-digit OTP for password reset (valid for 15 mins).
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Please enter a valid email address' });
      return;
    }

    const { email } = parsed.data;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't leak user existence in generic message
      res.status(200).json({
        message: 'If an account exists with this email, a 6-digit reset code has been generated.',
      });
      return;
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = expires;
    await user.save();

    console.log(`\n🔑 [PASSWORD RESET OTP] For ${email}: CODE = [ ${otp} ] (Expires in 15 mins)\n`);

    res.status(200).json({
      message: 'Password reset code has been sent. Please contact Super Admin or check your registered recovery channel for your 6-digit code.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/reset-password
 * Verifies the 6-digit OTP and updates user's password.
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, otp, newPassword } = parsed.data;
    const user = await User.findOne({ email }).select('+passwordHash +resetPasswordOtp +resetPasswordOtpExpires');

    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      res.status(400).json({ error: 'Invalid or expired reset code. Please request a new code.' });
      return;
    }

    if (new Date() > user.resetPasswordOtpExpires) {
      res.status(400).json({ error: 'Reset code has expired. Please request a new code.' });
      return;
    }

    if (user.resetPasswordOtp.trim() !== otp.trim()) {
      res.status(400).json({ error: 'Incorrect 6-digit reset code.' });
      return;
    }

    // Update password
    const bcrypt = await import('bcryptjs');
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    res.status(200).json({
      message: 'Password reset successfully! You can now sign in with your new password.',
    });
  } catch (err) {
    next(err);
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim().optional(),
  phone: z.string().trim().optional(),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
  libraryName: z.string().min(2, 'Library name must be at least 2 characters').trim().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
});

/**
 * GET /api/v1/auth/profile
 * Returns detailed profile of authenticated user & their library
 */
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let tenantData = undefined;
    if (user.tenantId) {
      const tenant = await Tenant.findById(user.tenantId);
      if (tenant) {
        tenantData = {
          id: tenant._id.toString(),
          name: tenant.name,
          slug: tenant.slug,
          email: tenant.email,
          phone: tenant.phone,
          city: tenant.city,
          address: tenant.address,
          subscriptionTier: tenant.subscriptionTier,
          subscriptionStatus: tenant.subscriptionStatus,
          subscriptionExpiresAt: tenant.subscriptionExpiresAt ? tenant.subscriptionExpiresAt.toISOString() : undefined,
          maxSeats: tenant.maxSeats,
          createdAt: tenant.createdAt.toISOString(),
        };
      }
    }

    res.status(200).json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      tenant: tenantData,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/auth/profile
 * Updates user profile details, library configuration, and optionally changes password.
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, phone, city, address, libraryName, currentPassword, newPassword } = parsed.data;

    // Load user with passwordHash
    const user = await User.findById(req.user.userId).select('+passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ error: 'Current password is required to set a new password' });
        return;
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(400).json({ error: 'Current password does not match' });
        return;
      }
      const bcrypt = await import('bcryptjs');
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    // Update user personal details
    if (name) {
      user.name = name;
    }
    await user.save();

    // If user is associated with a tenant and is owner/staff, update Tenant details
    let updatedTenant = null;
    if (user.tenantId) {
      const tenant = await Tenant.findById(user.tenantId);
      if (tenant) {
        if (libraryName && user.role === 'owner') {
          tenant.name = libraryName;
        }
        if (phone !== undefined) {
          tenant.phone = phone;
        }
        if (city !== undefined) {
          tenant.city = city;
        }
        if (address !== undefined) {
          tenant.address = address;
        }
        await tenant.save();
        updatedTenant = tenant;
      }
    }

    // Prepare updated AuthUser payload and re-issue cookie
    const updatedAuthUser: AuthUser = {
      ...req.user,
      name: user.name,
      tenantName: updatedTenant ? updatedTenant.name : req.user.tenantName,
      phone: updatedTenant?.phone ?? req.user.phone,
      city: updatedTenant?.city ?? req.user.city,
      address: updatedTenant?.address ?? req.user.address,
    };

    const token = generateToken(updatedAuthUser);
    res.cookie(AUTH_COOKIE, token, cookieOptions);

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedAuthUser,
    });
  } catch (err) {
    next(err);
  }
}
