/**
 * JWT access + refresh token helpers.
 *
 * Security notes:
 *  - Access token: short-lived (15m), stateless, sent by the client (Authorization header)
 *  - Refresh token: long-lived (7d), HttpOnly cookie, rotation on every use
 *  - Payloads carry { sub, role } only — never secrets
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from './ApiError';
import { Role } from '../types/enums';

export interface TokenPayload {
  sub: string; // user id
  role: Role;
}

export interface AccessTokenPayload extends TokenPayload {
  type: 'access';
}
export interface RefreshTokenPayload extends TokenPayload {
  type: 'refresh';
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (decoded.type !== 'access') throw new Error('wrong token type');
    return decoded;
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    if (decoded.type !== 'refresh') throw new Error('wrong token type');
    return decoded;
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
}

/** Cookie name + options (HttpOnly, SameSite=Lax, Secure in prod). */
export const REFRESH_COOKIE_NAME = 'rt';
export function refreshCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth',
  };
}
