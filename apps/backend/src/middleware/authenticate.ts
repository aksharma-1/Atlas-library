import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import { AUTH_COOKIE } from '../controllers/auth.controller';
import type { AuthUser } from '@atlas/shared';

// Extend Express Request to carry the verified user payload
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Middleware: authenticate
 *
 * Reads the JWT from the httpOnly cookie, verifies it, and attaches the
 * decoded AuthUser payload to `req.user`.
 *
 * IMPORTANT: tenantId is always read from the verified JWT — never from
 * the request body or query string, preventing tenant-spoofing.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token: unknown = req.cookies[AUTH_COOKIE];

  if (!token || typeof token !== 'string') {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}
