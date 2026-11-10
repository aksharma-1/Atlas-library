import type { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Seat } from '../models/Seat';
import { Student } from '../models/Student';
import { SaasPlan } from '../models/SaasPlan';

/**
 * Middleware: requireSuperAdmin
 * Ensures only users with role === 'superadmin' can access platform admin endpoints.
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'superadmin') {
    res.status(403).json({ error: 'Access denied: Platform Super-Admin privileges required' });
    return;
  }
  next();
}

/**
 * GET /api/v1/superadmin/tenants
 * Lists all registered libraries with their owners and subscription status.
 */
export async function listAllTenants(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 }).lean();

    // Fetch owner info for each tenant
    const tenantsWithOwners = await Promise.all(
      tenants.map(async (t) => {
        const owner = await User.findOne({ tenantId: t._id, role: 'owner' }).select('name email createdAt').lean();
        const seatCount = await Seat.countDocuments({ tenantId: t._id });
        const studentCount = await Student.countDocuments({ tenantId: t._id });
        return {
          ...t,
          ownerName: owner?.name || 'N/A',
          ownerEmail: owner?.email || t.email,
          ownerJoinedAt: owner?.createdAt,
          configuredSeats: seatCount,
          totalStudents: studentCount,
        };
      }),
    );

    res.status(200).json({ tenants: tenantsWithOwners });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/superadmin/tenants/:id/approve-subscription
 * Super-admin approves UPI UTR payment and activates library subscription.
 */
export async function approveTenantSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { days = 30, tier } = req.body;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    if (tier) {
      tenant.subscriptionTier = String(tier).trim();
    }

    // Look up maxDesks dynamically from SaasPlan
    const saasPlan = await SaasPlan.findOne({ code: tenant.subscriptionTier });
    if (saasPlan) {
      tenant.maxSeats = saasPlan.maxDesks;
    } else {
      tenant.maxSeats = 150;
    }

    // Extend from existing expiration if active, or from today if expired/new
    const baseDate = tenant.subscriptionExpiresAt && tenant.subscriptionExpiresAt > new Date()
      ? new Date(tenant.subscriptionExpiresAt)
      : new Date();

    baseDate.setDate(baseDate.getDate() + parseInt(days, 10));

    tenant.subscriptionStatus = 'active';
    tenant.onboardingStep = 'completed';
    tenant.subscriptionExpiresAt = baseDate;
    await tenant.save();

    // Ensure initial desks exist
    const existingSeats = await Seat.countDocuments({ tenantId: tenant._id });
    if (existingSeats === 0) {
      const initialDeskCount = Math.min(tenant.maxSeats, 30);
      const seatsToCreate = [];
      for (let i = 1; i <= initialDeskCount; i++) {
        seatsToCreate.push({
          tenantId: tenant._id,
          seatNumber: `A-${String(i).padStart(2, '0')}`,
          section: 'Main Study Hall',
          status: 'available',
        });
      }
      await Seat.insertMany(seatsToCreate);
    }

    res.status(200).json({
      message: `Successfully approved & activated subscription for "${tenant.name}" for ${days} days!`,
      tenant,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/superadmin/tenants/:id/toggle-status
 * Pause, suspend, or reactivate a library tenant account.
 */
export async function toggleTenantStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { $set: { isActive: typeof isActive === 'boolean' ? isActive : true } },
      { new: true },
    );

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    res.status(200).json({ message: 'Tenant status updated', tenant });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/superadmin/tenants/:id/reset-password
 * Super-admin can directly set a new password or generate a one-time OTP for any library owner.
 */
export async function resetTenantPasswordByAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const owner = await User.findOne({ tenantId: id, role: 'owner' });
    if (!owner) {
      res.status(404).json({ error: 'Library owner user not found for this tenant' });
      return;
    }

    if (newPassword && typeof newPassword === 'string' && newPassword.trim().length >= 6) {
      const bcrypt = await import('bcryptjs');
      owner.passwordHash = await bcrypt.hash(newPassword.trim(), 12);
      owner.resetPasswordOtp = undefined;
      owner.resetPasswordOtpExpires = undefined;
      await owner.save();

      res.status(200).json({
        message: `Password successfully updated for owner "${owner.email}"!`,
        ownerEmail: owner.email,
      });
      return;
    }

    // Otherwise generate a fresh 6-digit OTP visible only to the super-admin
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour for admin dispatch

    owner.resetPasswordOtp = otp;
    owner.resetPasswordOtpExpires = expires;
    await owner.save();

    res.status(200).json({
      message: `Generated recovery OTP for "${owner.email}". Provide this OTP to the client to enter on the reset screen.`,
      otp,
      ownerEmail: owner.email,
      expiresAt: expires.toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
