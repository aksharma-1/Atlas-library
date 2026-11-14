import type { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
}

/**
 * Global error handler — must be the last middleware registered on the app.
 * Hides internal details (stack traces, DB errors) from 500 responses.
 * Gracefully formats MongoDB E11000 duplicate key conflicts as 409 Conflict.
 * Logs 5xx errors server-side.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Handle Mongo duplicate key error (E11000)
  if (err.code === 11000 && err.keyValue) {
    const keys = Object.keys(err.keyValue).filter((k) => k !== 'tenantId');
    const field = keys[0] || 'field';
    const val = err.keyValue[field];
    res.status(409).json({
      error: `A record with ${field} "${val}" already exists. Please use a different value.`,
    });
    return;
  }

  const httpStatus = err.statusCode ?? 500;

  // Never leak internal error details in 500 responses
  const message = httpStatus >= 500 ? 'Internal Server Error' : err.message;

  if (httpStatus >= 500) {
    console.error('[ErrorHandler]', {
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(httpStatus).json({ error: message });
}
