/**
 * Review validators.
 */
import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createReviewSchema = z.object({
  product: mongoId,
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().min(2).max(1000),
  images: z.array(z.string().url('Invalid image URL')).max(4).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().min(2).max(1000).optional(),
});

export const listReviewsQuery = z.object({
  product: mongoId.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
});

export const reviewParams = z.object({
  id: mongoId,
  productId: mongoId.optional(),
  userId: mongoId.optional(),
});