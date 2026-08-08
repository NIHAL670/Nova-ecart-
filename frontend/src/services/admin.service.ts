import { get, patch, del, getWithMeta, client } from '@/lib/api';
import { api } from '@/constants';
import type { DashboardStats, TrendPoint, Order, User, Coupon, Product, PaginationMeta, OrderStatus } from '@/types';

// --- Analytics --------------------------------------------------------------

export async function fetchDashboard(): Promise<DashboardStats> {
  return get<DashboardStats>('/admin/dashboard');
}

export async function fetchRevenueTrend(days = 30): Promise<TrendPoint[]> {
  return get<TrendPoint[]>(`/admin/analytics/revenue-trend?days=${days}`);
}

export async function fetchOrderStatusBreakdown(): Promise<{ status: string; count: number }[]> {
  return get('/admin/analytics/order-status');
}

export async function fetchPaymentMethodBreakdown(): Promise<{ method: string; count: number; revenue: number }[]> {
  return get('/admin/analytics/payment-methods');
}

export async function fetchTopProducts(limit = 10): Promise<{ _id: string; name: string; sold: number; revenue: number }[]> {
  return get(`/admin/analytics/top-products?limit=${limit}`);
}

export async function fetchLowStock(): Promise<Product[]> {
  return get('/admin/analytics/low-stock');
}

export async function fetchSalesReport(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString() ? `?${params}` : '';
  return get(`/admin/reports/sales${qs}`);
}

// --- Orders -----------------------------------------------------------------

export async function adminFetchOrders(query: { page?: number; status?: OrderStatus; search?: string }): Promise<{ items: Order[]; meta: PaginationMeta }> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => v && params.set(k, String(v)));
  const { data, meta } = await getWithMeta<Order[]>(`/admin/orders?${params.toString()}`);
  return { items: data, meta: meta as PaginationMeta };
}

export async function adminUpdateOrderStatus(id: string, status: OrderStatus, note?: string) {
  return patch<Order>(`/admin/orders/${id}/status`, { status, note });
}

// --- Users ------------------------------------------------------------------

export async function adminListUsers(query: { page?: number; search?: string }): Promise<{ items: User[]; meta: PaginationMeta }> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => v && params.set(k, String(v)));
  const { data, meta } = await getWithMeta<User[]>(`/admin/users?${params.toString()}`);
  return { items: data, meta: meta as PaginationMeta };
}

export async function adminToggleUser(id: string, isActive: boolean) {
  return patch<User>(`/admin/users/${id}/status`, { isActive });
}

export async function adminDeleteUser(id: string) {
  return del<null>(`/admin/users/${id}`);
}

// --- Coupons (admin) ---------------------------------------------------------

export async function adminFetchCoupons(all = true) {
  return client.get(`/coupons?all=${all}`).then((r) => r.data.data as import('@/types').Coupon[]);
}
export async function adminCreateCoupon(input: Record<string, unknown>) {
  return client.post('/coupons', input).then((r) => r.data.data);
}
export async function adminUpdateCoupon(id: string, input: Record<string, unknown>) {
  return client.patch(`/coupons/${id}`, input).then((r) => r.data.data);
}
export async function adminDeleteCoupon(id: string) {
  return client.delete(`/coupons/${id}`);
}

// --- Products (admin) --------------------------------------------------------

export async function adminFetchProductsAll() {
  return get<Product[]>('/products?limit=100');
}
export async function adminCreateProduct(form: FormData) {
  return client.post('/products', form).then((r) => r.data.data);
}
export async function adminUpdateProduct(id: string, form: FormData) {
  return client.patch(`/products/${id}`, form).then((r) => r.data.data);
}
export async function adminDeleteProduct(id: string) {
  return client.delete(`/products/${id}`);
}
export async function adminFetchCategoriesAll() {
  return client.get('/categories?all=true').then((r) => r.data.data);
}
export async function adminCreateCategory(input: Record<string, unknown>) {
  return client.post('/categories', input).then((r) => r.data.data);
}
export async function adminUpdateCategory(id: string, input: Record<string, unknown>) {
  return client.patch(`/categories/${id}`, input).then((r) => r.data.data);
}
export async function adminDeleteCategory(id: string) {
  return client.delete(`/categories/${id}`);
}

export { get, client };