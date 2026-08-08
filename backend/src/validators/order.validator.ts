/**
 * Order / checkout validators. Each schema validates one request part; the
 * `validate` middleware keys them by part (body / query / params).
 */
import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const cartItemSchema = z.object({
  productId: mongoId,
  quantity: z.coerce.number().int().min(1).max(99),
  variant: z.string().optional(),
});

export const validateCartSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Cart is empty'),
  couponCode: z.string().trim().optional(),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Cart is empty'),
  shippingAddressId: mongoId,
  billingAddressId: mongoId.optional(),
  paymentMethod: z.enum(['stripe', 'razorpay', 'cod']),
  couponCode: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const orderParams = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order id') });

export const orderNumberParams = z.object({ orderNumber: z.string().trim().min(1) });

export const orderStatusSchema = z.object({
  status: z.enum(['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  note: z.string().trim().max(300).optional(),
});