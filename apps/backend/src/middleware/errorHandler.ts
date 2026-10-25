import type { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
}

/**
 * Global error handler — must be the last middleware registered on the app.
 * Hides internal details (stack traces, DB errors) from 500 responses.
 * Logs 5xx errors server-side.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
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
