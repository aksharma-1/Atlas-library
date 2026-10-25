import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { healthRouter } from './routes/health';
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

  // ── API routes ─────────────────────────────────────────────────────────────
  app.use('/api/v1/health', healthRouter);

  // ── Error handlers (must remain last) ─────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
