/**
 * Wishlist validators.
 */
import { z } from 'zod';

export const addToWishlistSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id'),
});