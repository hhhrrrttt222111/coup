import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../types';

const isProduction = process.env.NODE_ENV === 'production';

const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (isProduction) {
    console.error(`[${new Date().toISOString()}] ERROR:`, err.message);
  } else {
    console.error(err.stack);
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  res.status(500).json({
    error: isProduction ? 'Internal server error' : (err.message || 'Internal server error'),
    code: 'INTERNAL_ERROR',
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

export default errorHandler;
