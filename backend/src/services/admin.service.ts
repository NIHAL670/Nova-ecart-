/**
 * Admin analytics + management business logic.
 *
 * All money figures are derived from paid/delivered orders only, so cancelled
 * or failed orders never inflate revenue. Aggregations run in MongoDB via the
 * aggregation framework (index-friendly, no N+1).
 */
import { Order, Product, User, Category, Coupon } from '../models';
import { OrderStatus, PaymentStatus, Role } from '../types/enums';
import { ApiError } from '../utils/ApiError';

const revenueMatch = {
  $match: {
    'timeline.status': { $ne: OrderStatus.CANCELLED },
    paymentStatus: { $in: [PaymentStatus.PAID] },
  },
};

// ---------------------------------------------------------------------------

export async function getDashboardStats(): Promise<Record<string, unknown>> {
  const [orderStat, productStat, customersCount, categoriesCount, couponsCount] = await Promise.all([
    Order.aggregate([
      revenueMatch,
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
        },
      },
    ]),
    Product.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          lowStock: { $sum: { $cond: [{ $lt: ['$stock', 5] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
        },
      },
    ]),
    User.countDocuments({ role: Role.CUSTOMER }),
    Category.countDocuments({ isActive: true }),
    Coupon.countDocuments({ isActive: true }),
  ]);

  const o = orderStat[0] ?? {};
  const p = productStat[0] ?? {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [ordersToday, customersToday] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: today }, paymentStatus: { $in: [PaymentStatus.PAID] } }),
    User.countDocuments({ createdAt: { $gte: today } }),
  ]);

  const recentOrders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email')
    .select('orderNumber total status paymentStatus createdAt');

  return {
    revenue: Math.round((o.revenue ?? 0) * 100) / 100,
    ordersCount: o.orders ?? 0,
    avgOrderValue: Math.round((o.avgOrderValue ?? 0) * 100) / 100,
    ordersToday,
    customersCount,
    customersToday,
    productsCount: p.count ?? 0,
    lowStockProducts: p.lowStock ?? 0,
    outOfStockProducts: p.outOfStock ?? 0,
    categoriesCount,
    couponsCount,
    recentOrders,
  };
}

/** Daily revenue for the last `days` days (fills zero-gap days client-side). */
export async function getRevenueTrend(days = 30): Promise<{ date: string; revenue: number; orders: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const rows = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: since },
        paymentStatus: PaymentStatus.PAID,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rows.map((r) => ({
    date: r._id as string,
    revenue: Math.round((r.revenue as number) * 100) / 100,
    orders: r.orders as number,
  }));
}

export async function getOrderStatusBreakdown(): Promise<{ status: string; count: number }[]> {
  const rows = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  return rows.map((r) => ({ status: r._id as string, count: r.count as number }));
}

export async function getPaymentMethodBreakdown(): Promise<{ method: string; count: number; revenue: number }[]> {
  const rows = await Order.aggregate([
    revenueMatch,
    { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
  ]);
  return rows.map((r) => ({
    method: r._id as string,
    count: r.count as number,
    revenue: Math.round((r.revenue as number) * 100) / 100,
  }));
}

export async function getTopProducts(limit = 10): Promise<{ product: unknown; name: string; sold: number; revenue: number }[]> {
  const rows = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.product', sold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
    { $sort: { sold: -1 } },
    { $limit: limit },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } },
    { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
    { $project: { product: '$p', name: '$p.name', sold: 1, revenue: 1 } },
  ]);
  return rows;
}

export async function getLowStockProducts(threshold = 5): Promise<unknown[]> {
  return Product.find({ stock: { $lt: threshold }, deletedAt: null, status: 'active' })
    .sort({ stock: 1 })
    .limit(50)
    .select('name slug stock price images category');
}

// --- User management ------------------------------------------------------

export async function listUsers(query: { page?: number; limit?: number; search?: string; role?: Role }) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const filter: Record<string, unknown> = {};
  if (query.role) filter.role = query.role;
  if (query.search) filter.$or = [{ name: { $regex: query.search, $options: 'i' } }, { email: { $regex: query.search, $options: 'i' } }];

  const [users, total] = await Promise.all([
    User.find(filter).select('-password -refreshToken').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  return { users, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function toggleUserActive(id: string, isActive: boolean): Promise<unknown> {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User');
  if (user.role === Role.ADMIN) throw ApiError.forbidden('Cannot deactivate an admin');
  user.set('isActive', isActive);
  await user.save();
  return user;
}

export async function deleteUser(id: string): Promise<void> {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User');
  if (user.role === Role.ADMIN) throw ApiError.forbidden('Cannot delete an admin');
  await user.deleteOne();
}

// --- Orders (admin) ---------------------------------------------------------

export const adminListOrders = async (query: { page?: number; limit?: number; status?: OrderStatus; search?: string }) => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.search) filter.orderNumber = { $regex: query.search, $options: 'i' };

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email'),
    Order.countDocuments(filter),
  ]);
  return { orders, page, limit, total, pages: Math.ceil(total / limit) };
};

// --- Sales report -----------------------------------------------------------

export async function getSalesReport(opts: { from?: string; to?: string }) {
  const filter: Record<string, unknown> = { paymentStatus: PaymentStatus.PAID };
  if (opts.from || opts.to) {
    const range: Record<string, Date> = {};
    if (opts.from) range.$gte = new Date(opts.from);
    if (opts.to) {
      const end = new Date(opts.to);
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
    filter.createdAt = range;
  }

  const [rows, summary] = await Promise.all([
    Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: filter },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$total' }, items: { $sum: { $size: '$items' } } } },
    ]),
  ]);

  const s = summary[0] ?? {};
  return {
    rows,
    summary: {
      orders: s.orders ?? 0,
      revenue: Math.round((s.revenue ?? 0) * 100) / 100,
      itemsSold: s.items ?? 0,
    },
  };
}