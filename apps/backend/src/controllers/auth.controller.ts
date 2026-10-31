import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { loginUser } from '../services/auth.service';
import { env } from '../config/env';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
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
    // loginUser throws plain Error on bad credentials — return 401
    if (err instanceof Error && err.message === 'Invalid email or password') {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
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
 */
export function me(req: Request, res: Response): void {
  res.status(200).json({ user: req.user });
}
