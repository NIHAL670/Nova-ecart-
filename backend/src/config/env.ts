/**
 * Centralised, runtime-validated environment configuration.
 *
 * Every secret / tunable lives in one typed object instead of being spread
 * across the codebase via `process.env`. Values are parsed with Zod at boot so
 * a missing or malformed variable fails fast with a clear message.
 */
import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from the backend package root regardless of the CWD the process
// is launched from (e.g. when orchestrated from the repo root).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  REDIS_ENABLED: booleanFromString,

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be >= 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be >= 16 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECURE: booleanFromString,

  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000')
    .transform((v) => v.split(',').map((s) => s.trim())),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('Nova Cart <noreply@novacart.com>'),
  CLIENT_URL: z.string().default('http://localhost:3000'),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  DEFAULT_PAYMENT_GATEWAY: z.enum(['stripe', 'razorpay', 'cod', 'both']).default('both'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  ADMIN_EMAIL: z.string().email().default('admin@novacart.com'),
  ADMIN_PASSWORD: z.string().min(8).default('Admin@12345'),
  ADMIN_NAME: z.string().default('Nova Admin'),

  DEFAULT_TAX_RATE: z.coerce.number().min(0).max(1).default(0.08),
  FREE_SHIPPING_THRESHOLD: z.coerce.number().min(0).default(100),
  STANDARD_SHIPPING_FEE: z.coerce.number().min(0).default(8),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

export type Env = typeof env;
