/**
 * Address validators.
 */
import { z } from 'zod';

const phone = z.string().trim().min(7, 'Invalid phone').max(20, 'Invalid phone');

export const createAddressSchema = z.object({
  label: z.enum(['home', 'work', 'other']).optional(),
  name: z.string().trim().min(2).max(80),
  phone,
  addressLine1: z.string().trim().min(3).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(80).optional(),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

export const addressParams = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid address id') });