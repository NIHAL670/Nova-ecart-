/**
 * Category validators.
 */
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  image: z.string().url('Invalid image URL').optional(),
  parent: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryIdParams = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category id') });