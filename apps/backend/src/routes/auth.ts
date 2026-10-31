import { Router } from 'express';
import { login, logout, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

export const authRouter = Router();

/** POST /api/v1/auth/login  — public */
authRouter.post('/login', login);

/** POST /api/v1/auth/logout — public (clears cookie) */
authRouter.post('/logout', logout);

/** GET  /api/v1/auth/me     — protected */
authRouter.get('/me', authenticate, me);
