/**
 * Authentication & authorization middleware.
 *
 *  - `authenticate` : parses the `Authorization: Bearer <jwt>` header, verifies
 *    it, and attaches `req.user`. Throws 401 when missing/invalid.
 *  - `authorize`    : factory that returns a guard ensuring `req.user.role` is
 *    in the allowed set (e.g. `authorize(Role.ADMIN)`).
 */
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/tokens';
import { Role } from '../types/enums';
import { asyncHandler } from '../utils/asyncHandler';

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No access token provided');
  }
  const token = header.split(' ')[1];
  const payload = verifyAccessToken(token);
  req.user = { id: payload.sub, role: payload.role };
  next();
});

/** Optional auth: attaches user when a valid token is present, else `next()`. */
export const authenticateOptional = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(header.split(' ')[1]);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // ignore invalid optional token — treat as anonymous
    }
  }
  next();
});

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };