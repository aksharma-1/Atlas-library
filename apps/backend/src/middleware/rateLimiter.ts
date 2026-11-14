import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Standard Auth Rate Limiter
 * Applied to POST /api/v1/auth/login and POST /api/v1/auth/register
 *
 * Configurable via AUTH_RATE_LIMIT_WINDOW_MS and AUTH_RATE_LIMIT_MAX_ATTEMPTS.
 * Returns HTTP 429 when threshold exceeded.
 */
export const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  standardHeaders: true, // draft-6 RateLimit-* headers
  legacyHeaders: false, // X-RateLimit-* headers
  // Don't rate-limit in automated testing unless explicitly testing rate limits
  skip: () => env.NODE_ENV === 'test' && !process.env['ENABLE_TEST_RATE_LIMIT'],
  message: {
    error: 'Too many authentication attempts. Please try again later.',
  },
});

/**
 * Strict Password Reset & OTP Rate Limiter
 * Applied to POST /api/v1/auth/forgot-password and POST /api/v1/auth/reset-password
 *
 * Mitigates OTP brute-forcing and email enumeration attacks.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.PASSWORD_RESET_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test' && !process.env['ENABLE_TEST_RATE_LIMIT'],
  message: {
    error: 'Too many password reset attempts. Please wait 15 minutes before trying again.',
  },
});
