import { Router } from 'express';
import type { Request, Response } from 'express';
import type { HealthResponse } from '@atlas/shared';

export const healthRouter = Router();

/**
 * GET /api/v1/health
 *
 * Lightweight liveness probe — no DB or external dependency checks.
 * Returns 200 as long as the Express process is alive.
 */
healthRouter.get('/', (_req: Request, res: Response): void => {
  const body: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] ?? 'development',
    version: process.env['npm_package_version'] ?? '0.0.0',
  };
  res.status(200).json(body);
});
