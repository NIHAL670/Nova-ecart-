/**
 * Product handlers — public catalog reads plus admin CRUD (guarded in routes).
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';
import * as service from '../services/product.service';
import { getUploadedFiles, storeImage } from '../utils/upload';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listProducts(req.query as Record<string, unknown>);
  res.json(
    ok(
      result.products,
      'Products fetched',
      { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
    ),
  );
});

export const featured = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await service.featuredProducts(Number(req.query.limit) || 12), 'Featured products'));
});

export const bestSellers = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await service.bestSellers(Number(req.query.limit) || 12), 'Best sellers'));
});

export const latest = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await service.latestArrivals(Number(req.query.limit) || 12), 'Latest arrivals'));
});

export const offers = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await service.specialOffers(Number(req.query.limit) || 12), 'Special offers'));
});

export const trending = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await service.trendingProducts(Number(req.query.limit) || 12), 'Trending products'));
});

export const suggestions = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '');
  res.json(ok(await service.searchSuggestions(q), 'Suggestions'));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await service.getProductById(req.params.id), 'Product fetched'));
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await service.getProductBySlug(req.params.slug), 'Product fetched'));
});

export const related = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.getProductById(req.params.id);
  const related = await service.relatedProducts(product.id, String(product.category));
  res.json(ok(related, 'Related products'));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  let images: { url: string; publicId?: string }[] = [];
  const files = getUploadedFiles(req);
  if (files.length) {
    images = [];
    for (const file of files) {
      const stored = await storeImage(file);
      images.push({ url: stored.url, publicId: stored.publicId });
    }
  }
  const product = await service.createProduct({ ...req.body, images: images.length ? images : req.body.images });
  res.status(201).json(ok(product, 'Product created'));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  let images = req.body.images;
  const files = getUploadedFiles(req);
  if (files.length) {
    images = [];
    for (const file of files) {
      const stored = await storeImage(file);
      images.push({ url: stored.url, publicId: stored.publicId });
    }
  }
  const product = await service.updateProduct(req.params.id, { ...req.body, ...(images ? { images } : {}) });
  res.json(ok(product, 'Product updated'));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteProduct(req.params.id);
  res.json(ok(null, 'Product deleted'));
});