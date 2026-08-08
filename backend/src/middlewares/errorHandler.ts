/**
 * Global error handler — the single place every thrown error is normalised
 * into the API response envelope.
 *
 * Handles:
 *  - our own `ApiError` (operational)
 *  - Mongoose cast / duplicate / validation errors
 *  - JWT errors
 *  - anything else -> 500 (operational flag false; details hidden in prod)
 */
import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { isProduction } from '../config/env';

const logError = (err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('💥 Error:', err);
};

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound('Route'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // Normalise into an ApiError.
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof mongoose.Error.ValidationError) {
    error = ApiError.badRequest('Validation error', err.errors);
  } else if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid ${err.path} value: "${err.value}"`);
  } else if (err instanceof TokenExpiredError) {
    error = ApiError.unauthorized('Access token expired');
  } else if (err instanceof JsonWebTokenError) {
    error = ApiError.unauthorized('Invalid token');
  } else if (err && typeof err === 'object' && 'code' in err && (err as any).code === 11000) {
    const key = Object.keys((err as any).keyValue ?? {})[0] ?? 'field';
    error = ApiError.badRequest(`${key} already exists`);
  } else {
    error = new ApiError(500, err instanceof Error ? err.message : 'Internal server error');
    logError(err);
  }

  if (!error.isOperational) logError(err);

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message,
    ...(error.details ? { errors: error.details } : {}),
    ...(isProduction && statusCode >= 500 ? {} : { stack: error.stack }),
  });
}