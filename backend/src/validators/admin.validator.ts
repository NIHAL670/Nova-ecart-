/**
 * Admin management validators.
 */
import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const listUsersQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().optional(),
  role: z.enum(['admin', 'customer']).optional(),
});

export const userStatusSchema = z.object({
  isActive: z.boolean(),
});

export const adminOrderParams = z.object({ id: mongoId });

export const daysQuery = z.object({ days: z.coerce.number().int().min(1).max(365).optional() });
export const fromToQuery = z.object({ from: z.string().optional(), to: z.string().optional() });