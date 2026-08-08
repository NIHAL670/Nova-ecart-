/**
 * Review handlers.
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';
import * as service from '../services/review.service';
import { Role } from '../types/enums';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listReviews(
    req.query as unknown as { product?: string; page?: number; limit?: number; sort?: string },
  );
  res.json(
    ok(result.reviews, 'Reviews fetched', {
      avgRating: result.avgRating,
      count: result.count,
      distribution: result.distribution,
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: result.pages,
    }),
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await service.getReview(req.params.id), 'Review fetched'));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const review = await service.createReview(req.user!.id, req.body);
  res.status(201).json(ok(review, 'Review added'));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const review = await service.updateReview(req.user!.id, req.params.id, req.body);
  res.json(ok(review, 'Review updated'));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteReview(req.user!.id, req.params.id, req.user!.role === Role.ADMIN);
  res.json(ok(null, 'Review deleted'));
});