import { describe, expect, it } from 'vitest';
import { signAccessToken, signRefreshToken, verifyAccessToken } from './tokens';
import { ApiError } from './ApiError';
import { Role } from '../types/enums';

const payload = { sub: '507f1f77bcf86cd799439011', role: Role.CUSTOMER };

describe('tokens', () => {
  it('signs and verifies an access token', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.type).toBe('access');
  });

  it('rejects a refresh token used as an access token', () => {
    const token = signRefreshToken(payload);
    expect(() => verifyAccessToken(token)).toThrow(ApiError);
  });

  it('produces distinct access/refresh tokens', () => {
    expect(signAccessToken(payload)).not.toBe(signRefreshToken(payload));
  });

  it('throws on a tampered token', () => {
    const token = signAccessToken(payload);
    expect(() => verifyAccessToken(`${token.slice(0, -2)}xx`)).toThrow();
  });
});