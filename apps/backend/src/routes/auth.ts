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

export const authRouter = Router();

/** POST /api/v1/auth/login  — public */
authRouter.post('/login', login);

/** POST /api/v1/auth/register — public self-service registration */
authRouter.post('/register', register);

/** POST /api/v1/auth/forgot-password — public request reset code */
authRouter.post('/forgot-password', forgotPassword);

/** POST /api/v1/auth/reset-password — public verify code & set new password */
authRouter.post('/reset-password', resetPassword);

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
