/**
 * Coupon validators (admin CRUD + public validate). Needed by the web
 */
import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(30),
  description: z.string().trim().max(300).optional(),
  type: z.enum(['percentage', 'flat']),
  value: z.coerce.number().positive('Value must be positive'),
  maxDiscount: z.coerce.number().positive().optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  appliesToCategories: z.array(z.string()).optional(),
  appliesToProducts: z.array(z.string()).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponQuery = z.object({
  code: z.string().trim().min(1),
  subtotal: z.coerce.number().min(0).default(0),
});

export const couponParams = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid coupon id') });