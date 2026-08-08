import type { OrderStatus, PaymentMethod } from '@/types';

/** React Query cache keys — centralised to invalidate consistently. */
export const queryKeys = {
  products: (params?: string) => ['products', params ?? 'all'] as const,
  product: (slug: string) => ['product', slug] as const,
  related: (id: string) => ['related', id] as const,
  families: { featured: ['products', 'featured'], bestSellers: ['products', 'best-sellers'], latest: ['products', 'latest'], offers: ['products', 'offers'], trending: ['products', 'trending'] },
  categories: ['categories'] as const,
  categoryTree: ['categories', 'tree'] as const,
  reviews: (productId: string, page?: number) => ['reviews', productId, page ?? 1] as const,
  wishlist: ['wishlist'] as const,
  cartValidate: ['cart', 'validate'] as const,
  orders: (page?: number) => ['orders', page ?? 1] as const,
  order: (id: string) => ['order', id] as const,
  addresses: ['addresses'] as const,
  admin: { dashboard: ['admin', 'dashboard'] as const, trend: (d: number) => ['admin', 'trend', d] as const, orders: ['admin', 'orders'] as const, users: ['admin', 'users'] as const, coupons: ['admin', 'coupons'] as const, lowStock: ['admin', 'low-stock'] as const, revenue: ['admin', 'revenue'] as const },
};

/** localStorage / session keys. */
export const storageKeys = {
  auth: 'novacart.auth',
  cart: 'novacart.cart',
  wishlist: 'novacart.wishlist',
  theme: 'novacart.theme',
  recentlyViewed: 'novacart.recentlyViewed',
} as const;

/** API route constants (relative to NEXT_PUBLIC_API_URL). */
export const api = {
  auth: {
    register: '/auth/register',
    verifyEmail: '/auth/register/verify-email',
    resendOtp: '/auth/register/resend-otp',
    login: '/auth/login',
    refresh: '/auth/refresh-token',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    me: '/auth/me',
  },
  products: {
    list: '/products',
    slug: (slug: string) => `/products/slug/${slug}`,
    byId: (id: string) => `/products/${id}`,
    related: (id: string) => `/products/${id}/related`,
    suggestions: '/products/suggestions',
    featured: '/products/featured',
    bestSellers: '/products/best-sellers',
    latest: '/products/latest',
    offers: '/products/offers',
    trending: '/products/trending',
    create: '/products',
    update: (id: string) => `/products/${id}`,
    remove: (id: string) => `/products/${id}`,
  },
  categories: { list: '/categories', tree: '/categories/tree' },
  reviews: { list: '/reviews', create: '/reviews', update: (id: string) => `/reviews/${id}`, remove: (id: string) => `/reviews/${id}` },
  wishlist: { get: '/wishlist', toggle: '/wishlist/toggle', check: (id: string) => `/wishlist/check/${id}`, remove: (id: string) => `/wishlist/${id}` },
  addresses: { list: '/addresses', create: '/addresses', update: (id: string) => `/addresses/${id}`, remove: (id: string) => `/addresses/${id}`, setDefault: (id: string) => `/addresses/${id}/default` },
  coupons: { validate: '/coupons/validate' },
  orders: { validateCart: '/orders/cart/validate', checkout: '/orders/checkout', myOrders: '/orders/my-orders', byNumber: (n: string) => `/orders/order-number/${n}`, byId: (id: string) => `/orders/${id}`, cancel: (id: string) => `/orders/${id}/cancel` },
  users: { profile: '/users/profile', password: '/users/password', avatar: '/users/avatar' },
  payments: { stripeWebhook: '/payments/webhook/stripe' },
};

/** Display metadata for order statuses. */
export const orderStatusStyles: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  placed: { label: 'Placed', className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
  confirmed: { label: 'Confirmed', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' },
  processing: { label: 'Processing', className: 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' },
  shipped: { label: 'Shipped', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  delivered: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' },
  refunded: { label: 'Refunded', className: 'bg-slate-200 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400' },
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  stripe: 'Card · Stripe',
  razorpay: 'Razorpay',
  cod: 'Cash on Delivery',
};

export const ORDER_STATUS_FLOW: OrderStatus[] = ['pending', 'placed', 'confirmed', 'processing', 'shipped', 'delivered'];