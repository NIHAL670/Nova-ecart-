/**
 * Shared runtime enums used across models, validators and controllers.
 */
export enum Role {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PENDING = 'pending',
  PLACED = 'placed',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay',
  COD = 'cod',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum CouponType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
}

export enum OtpPurpose {
  SIGNUP = 'signup',
  FORGOT_PASSWORD = 'forgot_password',
  RESEND = 'resend',
}

/** Fields users can safely expose in the API (no password / version). */
export const PUBLIC_USER_FIELDS = '-password -refreshToken -otp -__v';

/** Redis cache-key helpers so invalidation stays centralised. */
export const cacheKeys = {
  products: (page: number, filter: string) => `products:${page}:${filter}`,
  product: (id: string) => `product:${id}`,
  categories: () => 'categories:all',
  featured: () => 'products:featured',
  bestSellers: () => 'products:bestSellers',
  latest: () => 'products:latest',
  analytics: () => 'analytics:dashboard',
  invalidateProduct: (id: string) => `product:${id}`,
};
