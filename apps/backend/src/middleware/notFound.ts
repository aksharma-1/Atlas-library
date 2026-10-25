import type { Request, Response, NextFunction } from 'express';

/**
 * 404 handler — mounted after all routes.
 * Returns a consistent JSON error body instead of Express's default HTML.
 */
export function notFound(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
  });
}
