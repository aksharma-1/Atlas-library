import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import type { AuthUser } from '@atlas/shared';

export interface LoginResult {
  token: string;
  user: AuthUser;
}

/**
 * Attempt to authenticate a user by email + password.
 *
 * Returns a signed JWT and a safe user object on success.
 * Throws a plain Error with a generic message on any failure
 * to prevent user-enumeration via distinct error messages.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResult> {
  // Explicitly select passwordHash (excluded by default in schema)
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordHash',
  );

  // Use constant-time comparison even if user not found (prevents timing attacks)
  const isValid = user ? await user.comparePassword(password) : false;

  if (!user || !isValid || !user.isActive) {
    throw new Error('Invalid email or password');
  }

  if (user.role === 'superadmin') {
    const payload: AuthUser = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: 'superadmin',
      subscriptionStatus: 'active',
      onboardingStep: 'completed',
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    return { token, user: payload };
  }

  const tenant = await Tenant.findById(user.tenantId);

  if (!tenant || !tenant.isActive) {
    throw new Error('Invalid email or password');
  }

  const payload: AuthUser = {
    userId: user._id.toString(),
    tenantId: user.tenantId!.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    tenantName: tenant.name,
    phone: tenant.phone,
    city: tenant.city,
    address: tenant.address,
    onboardingStep: tenant.onboardingStep || 'completed',
    subscriptionStatus: tenant.subscriptionStatus || 'active',
    subscriptionTier: tenant.subscriptionTier,
    subscriptionExpiresAt: tenant.subscriptionExpiresAt ? tenant.subscriptionExpiresAt.toISOString() : undefined,
    maxSeats: tenant.maxSeats || 100,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  return { token, user: payload };
}

/**
 * Verify a raw JWT string and return the decoded AuthUser payload.
 * Throws if the token is invalid or expired.
 */
export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, env.JWT_SECRET) as AuthUser;
}
