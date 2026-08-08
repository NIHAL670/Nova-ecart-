/**
 * Admin handlers — dashboard analytics, order/user management, sales reports.
 * All routes behind `authorize(Role.ADMIN)`.
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';
import * as admin from '../services/admin.service';
import { adminUpdateOrderStatus } from '../services/order.service';
import { OrderStatus } from '../types/enums';

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  res.json(ok(await admin.getDashboardStats(), 'Dashboard fetched'));
});

export const revenueTrend = asyncHandler(async (req: Request, res: Response) => {
  const days = Number(req.query.days) || 30;
  res.json(ok(await admin.getRevenueTrend(days), 'Revenue trend'));
});

export const orderStatusBreakdown = asyncHandler(async (_req: Request, res: Response) => {
  res.json(ok(await admin.getOrderStatusBreakdown(), 'Order breakdown'));
});

export const paymentMethodBreakdown = asyncHandler(async (_req: Request, res: Response) => {
  res.json(ok(await admin.getPaymentMethodBreakdown(), 'Payment breakdown'));
});

export const topProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  res.json(ok(await admin.getTopProducts(limit), 'Top products'));
});

export const lowStock = asyncHandler(async (_req: Request, res: Response) => {
  res.json(ok(await admin.getLowStockProducts(5), 'Low stock products'));
});

export const salesReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await admin.getSalesReport({ from: req.query.from as string, to: req.query.to as string });
  res.json(ok(report, 'Sales report'));
});

// --- Orders -----------------------------------------------------------------

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await admin.adminListOrders(req.query as never);
  res.json(ok(result.orders, 'Orders fetched', { page: result.page, limit: result.limit, total: result.total, pages: result.pages }));
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await adminUpdateOrderStatus(req.params.id, req.body.status as OrderStatus, req.body.note);
  res.json(ok(order, 'Order status updated'));
});

// --- Users ------------------------------------------------------------------

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await admin.listUsers(req.query as never);
  res.json(ok(result.users, 'Users fetched', { page: result.page, limit: result.limit, total: result.total, pages: result.pages }));
});

export const toggleUser = asyncHandler(async (req: Request, res: Response) => {
  const isActive = req.body.isActive !== false;
  const user = await admin.toggleUserActive(req.params.id, isActive);
  res.json(ok(user, isActive ? 'User activated' : 'User deactivated'));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await admin.deleteUser(req.params.id);
  res.json(ok(null, 'User deleted'));
});