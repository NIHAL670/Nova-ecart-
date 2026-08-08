/**
 * Admin routes — every handler behind authenticate + authorize(Role.ADMIN).
 */
import { Router } from 'express';
import * as admin from '../controllers/admin.controller';
import { validate } from '../middlewares/validate';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '../types/enums';
import { listUsersQuery, userStatusSchema, adminOrderParams, daysQuery, fromToQuery } from '../validators/admin.validator';
import { orderStatusSchema } from '../validators/order.validator';

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

// Analytics
router.get('/dashboard', admin.dashboard);
router.get('/analytics/revenue-trend', validate({ query: daysQuery }), admin.revenueTrend);
router.get('/analytics/order-status', admin.orderStatusBreakdown);
router.get('/analytics/payment-methods', admin.paymentMethodBreakdown);
router.get('/analytics/top-products', admin.topProducts);
router.get('/analytics/low-stock', admin.lowStock);
router.get('/reports/sales', validate({ query: fromToQuery }), admin.salesReport);

// Orders
router.get('/orders', admin.listOrders);
router.patch('/orders/:id/status', validate({ params: adminOrderParams, body: orderStatusSchema }), admin.updateOrderStatus);

// Users
router.get('/users', validate({ query: listUsersQuery }), admin.listUsers);
router.patch('/users/:id/status', validate({ params: adminOrderParams, body: userStatusSchema }), admin.toggleUser);
router.delete('/users/:id', validate({ params: adminOrderParams }), admin.deleteUser);

export default router;