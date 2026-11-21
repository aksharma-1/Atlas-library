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
  // 1. Primary: HttpOnly cookie (Browsers & Desktop)
  let rawToken: string | undefined =
    typeof req.cookies?.[AUTH_COOKIE] === 'string'
      ? req.cookies[AUTH_COOKIE]
      : undefined;

  // 2. Secondary Fallback: Authorization Bearer header (iOS Standalone PWA / WebViews where cross-domain cookies are dropped by ITP)
  if (!rawToken) {
    const authHeader = req.headers.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      rawToken = authHeader.substring(7).trim();
    }
  }

  if (!rawToken) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    req.user = verifyToken(rawToken);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}
