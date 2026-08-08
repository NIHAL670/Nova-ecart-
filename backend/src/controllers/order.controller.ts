/**
 * Order + checkout handlers (protected). Also exposes cart validation so the
 * UI can show live totals/shipping before the user checks out.
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';
import * as orderService from '../services/order.service';
import { initCheckout } from '../services/checkout.service';

export const validateCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await orderService.validateCart(req.body);
  res.json(ok(cart, 'Cart validated'));
});

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const result = await initCheckout({ userId: req.user!.id, ...req.body });
  res.status(201).json(ok(result, 'Order created'));
});

export const listMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await orderService.listMyOrders(req.user!.id, page, limit);
  res.json(ok(result.orders, 'Orders fetched', { page: result.page, limit: result.limit, total: result.total, pages: result.pages }));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await orderService.getOrderById(req.params.id, req.user!.id), 'Order fetched'));
});

export const getByNumber = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await orderService.getOrderByNumber(req.params.orderNumber, req.user!.id), 'Order fetched'));
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.cancelOrder(req.user!.id, req.params.id);
  res.json(ok(order, 'Order cancelled'));
});