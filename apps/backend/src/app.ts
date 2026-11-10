import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import {
  shiftsRouter,
  plansRouter,
  seatsRouter,
  dashboardRouter,
} from './routes/library';
import {
  studentsRouter,
  membershipsRouter,
  paymentsRouter,
} from './routes/student.routes';
import { superadminRouter } from './routes/superadmin.routes';
import { saasPlansRouter } from './routes/saasPlan.routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

/**
 * Factory function that builds and returns the configured Express application.
 *
 * Keeping app construction separate from server.listen() allows Supertest
 * to import the app directly without opening a real port.
 */
export function createApp(): Express {
  const app = express();

  // Trust reverse proxy (Render, Cloudflare, etc.) so secure cookies work over HTTPS on mobile
  app.set('trust proxy', 1);

  // ── Security headers ───────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ───────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  // ── Request logging (suppressed in test to keep output clean) ─────────────
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // ── Body parsing ───────────────────────────────────────────────────────────
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Cookie parsing (required for httpOnly JWT cookie) ─────────────────────
  app.use(cookieParser());

  // ── API routes ─────────────────────────────────────────────────────────────
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/shifts', shiftsRouter);
  app.use('/api/v1/plans', plansRouter);
  app.use('/api/v1/seats', seatsRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/students', studentsRouter);
  app.use('/api/v1/memberships', membershipsRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/saas-plans', saasPlansRouter);
  app.use('/api/v1/superadmin', superadminRouter);

  // ── Error handlers (must remain last) ─────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
