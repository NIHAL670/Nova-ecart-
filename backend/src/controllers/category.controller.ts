/**
 * Category handlers.
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';
import * as service from '../services/category.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const categories = await service.listCategories(req.query?.all === 'true');
  res.json(ok(categories, 'Categories fetched'));
});

export const tree = asyncHandler(async (_req: Request, res: Response) => {
  const tree = await service.getCategoryTree();
  res.json(ok(tree, 'Category tree fetched'));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const category = await service.getCategoryById(req.params.id);
  res.json(ok(category, 'Category fetched'));
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await service.getCategoryBySlug(req.params.slug);
  res.json(ok(category, 'Category fetched'));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const category = await service.createCategory(req.body);
  res.status(201).json(ok(category, 'Category created'));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const category = await service.updateCategory(req.params.id, req.body);
  res.json(ok(category, 'Category updated'));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteCategory(req.params.id);
  res.json(ok(null, 'Category deleted'));
});