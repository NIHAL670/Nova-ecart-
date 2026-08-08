/**
 * Wishlist handlers (all protected).
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';
import * as service from '../services/wishlist.service';

export const get = asyncHandler(async (req: Request, res: Response) => {
  const items = await service.getWishlist(req.user!.id);
  res.json(ok(items, 'Wishlist fetched'));
});

export const toggle = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.toggleItem(req.user!.id, req.body.productId);
  res.json(ok(result, result.added ? 'Added to wishlist' : 'Removed from wishlist'));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const items = await service.removeItem(req.user!.id, req.params.productId);
  res.json(ok(items, 'Removed from wishlist'));
});

export const check = asyncHandler(async (req: Request, res: Response) => {
  const isWishlisted = await service.isWishlisted(req.user!.id, req.params.productId);
  res.json(ok({ isWishlisted }, 'Wishlist status'));
});

export const clear = asyncHandler(async (req: Request, res: Response) => {
  await service.clearWishlist(req.user!.id);
  res.json(ok([], 'Wishlist cleared'));
});