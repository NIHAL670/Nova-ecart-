import { describe, expect, it } from 'vitest';
import { generateOtp } from './otp.service';

describe('generateOtp', () => {
  it('produces a 6-digit numeric code', () => {
    const code = generateOtp();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('produces unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, generateOtp));
    expect(codes.size).toBeGreaterThan(90);
  });
});