import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';
import { sendError } from '../common/response';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.code, err.details);
    return;
  }

  console.error('[UnhandledError]', err);
  sendError(res, 500, 'An unexpected server error occurred', 'INTERNAL_SERVER_ERROR', process.env.NODE_ENV === 'development' ? err.stack : undefined);
}
