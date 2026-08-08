/**
 * Coupon handlers. Validate is public (used at checkout); CRUD is admin-only.
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';
import * as service from '../services/coupon.service';

export const validate = asyncHandler(async (req: Request, res: Response) => {
  const code = String(req.query.code ?? '');
  const subtotal = Number(req.query.subtotal) || 0;
  const result = await service.validateCoupon(code, { subtotal });
  res.json(ok({ code: result.coupon.code, discount: result.discount, type: result.coupon.type, value: result.coupon.value }, 'Coupon is valid'));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await service.listCoupons(req.query.all === 'true'), 'Coupons fetched'));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await service.getCoupon(req.params.id), 'Coupon fetched'));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await service.createCoupon(req.body);
  res.status(201).json(ok(coupon, 'Coupon created'));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await service.updateCoupon(req.params.id, req.body);
  res.json(ok(coupon, 'Coupon updated'));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteCoupon(req.params.id);
  res.json(ok(null, 'Coupon deleted'));
});