/**
 * Zod schemas for all auth endpoints. Each schema validates a single request
 * part (usually `body`); the `validate` middleware keys them by part.
 *
 * Rules: valid email, strong password (min 8, letter + number), 6-digit OTPs.
 */
import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const email = z.string().email('Invalid email address').max(120);

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email,
  password,
  phone: z.string({ required_error: 'number not correct' }).trim().regex(/^\d{10}$/, 'number not correct'),
  countryCode: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  email,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
  purpose: z.enum(['signup', 'forgot_password']),
});

export const resendOtpSchema = z.object({
  email,
  purpose: z.enum(['signup', 'forgot_password']),
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  email,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
  newPassword: password,
});

// No strict schema needed — refresh token may come from the httpOnly cookie.
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});