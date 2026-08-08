/**
 * Product validators.
 */
import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const variantSchema = z.object({
  name: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  price: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  attributes: z.record(z.string()).optional(),
});

export const productIdParams = z.object({ id: mongoId });

export const upsertProductSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    description: z.string().min(10, 'Description too short'),
    shortDescription: z.string().trim().max(300).optional(),
    category: mongoId,
    subCategory: mongoId.optional(),
    brand: z.string().trim().optional(),
    tags: z.array(z.string().trim()).max(20).optional(),
    price: z.coerce.number().min(0),
    discountedPrice: z.coerce.number().min(0).optional(),
    compareAtPrice: z.coerce.number().min(0).optional(),
    currency: z.string().default('USD'),
    stock: z.coerce.number().int().min(0).default(0),
    sku: z.string().trim().optional(),
    isFeatured: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    onSale: z.boolean().optional(),
    status: z.enum(['active', 'draft', 'archived']).default('active'),
    variants: z.array(variantSchema).optional(),
    attributes: z.record(z.string()).optional(),
  })
  .strict();

/** Multipart form submission — the body may arrive as text fields (uploads separate). */
export const productFormSchema = upsertProductSchema.partial().passthrough();

export const listProductsQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().optional(),
  sort: z.string().trim().optional(),
  category: z.string().trim().optional(),
  subCategory: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  isFeatured: z.union([z.boolean(), z.string()]).optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  inStock: z.enum(['true', 'false']).optional(),
});