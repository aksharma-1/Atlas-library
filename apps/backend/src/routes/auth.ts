import { Router } from 'express';
import {
  login,
  register,
  logout,
  me,
  configureLibrary,
  submitPaymentUtr,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';

export const authRouter = Router();

/** POST /api/v1/auth/login  — public with rate limiting */
authRouter.post('/login', authLimiter, login);

/** POST /api/v1/auth/register — public self-service registration with rate limiting */
authRouter.post('/register', authLimiter, register);

/** POST /api/v1/auth/forgot-password — public request reset code with strict rate limiting */
authRouter.post('/forgot-password', passwordResetLimiter, forgotPassword);

/** POST /api/v1/auth/reset-password — public verify code & set new password with strict rate limiting */
authRouter.post('/reset-password', passwordResetLimiter, resetPassword);

/** POST /api/v1/auth/logout — public (clears cookie) */
authRouter.post('/logout', logout);

/** GET  /api/v1/auth/me     — protected */
authRouter.get('/me', authenticate, me);

/** GET  /api/v1/auth/profile — protected user profile */
authRouter.get('/profile', authenticate, getProfile);

/** PUT  /api/v1/auth/profile — protected update user profile */
authRouter.put('/profile', authenticate, updateProfile);

/** POST /api/v1/auth/configure-library — protected onboarding step 2 */
authRouter.post('/configure-library', authenticate, configureLibrary);

/** POST /api/v1/auth/submit-payment — protected submit UPI UTR */
authRouter.post('/submit-payment', authenticate, submitPaymentUtr);
