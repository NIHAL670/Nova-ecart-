/** Domain types shared across the storefront (mirrors the backend responses). */

export type Role = 'admin' | 'customer';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: Role;
  isEmailVerified: boolean;
}

export interface ProductImage {
  url: string;
  publicId?: string;
}

export interface ProductVariant {
  name: string;
  sku?: string;
  price?: number;
  stock: number;
  attributes?: Record<string, string>;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string | Category;
  subCategory?: string | Category;
  brand?: string;
  tags: string[];
  images: ProductImage[];
  price: number;
  discountedPrice?: number;
  compareAtPrice?: number;
  currency: string;
  stock: number;
  sku?: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  onSale: boolean;
  status: 'active' | 'draft' | 'archived';
  rating: number;
  reviewCount: number;
  soldCount: number;
  variants: ProductVariant[];
  effectivePrice: number;
  discountPercent: number;
  createdAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | Category;
  isActive: boolean;
  productCount?: number;
  children?: Category[];
}

export interface Review {
  _id: string;
  user: { _id: string; name: string; avatar?: string };
  product: string;
  rating: number;
  title?: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface Address {
  _id: string;
  label: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  type: 'percentage' | 'flat';
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
}

export interface OrderItem {
  product: string;
  name: string;
  image: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  total: number;
  variant?: string;
}

export type OrderStatus = 'pending' | 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentMethod = 'stripe' | 'razorpay' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | { _id: string; name: string; email: string };
  items: OrderItem[];
  shippingAddress: Omit<Address, '_id' | 'user' | 'label' | 'isDefault'>;
  coupon?: { code: string; type: 'percentage' | 'flat'; value: number; discount: number };
  currency: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  taxRate: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  trackingNumber?: string;
  notes?: string;
  timeline: { status: OrderStatus; at: string; note?: string }[];
  createdAt: string;
}

/** Cart line persisted in the local cart store / sent to checkout. */
export interface CartItem {
  productId: string;
  quantity: number;
  variant?: string;
  // Denormalised snapshot for optimistic UI.
  name: string;
  slug: string;
  image: string;
  price: number;
  currency: string;
  stock: number;
}

/** Server-computed pricing summary returned by /orders/cart/validate. */
export interface PriceBreakdown {
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  taxRate: number;
  total: number;
  shippingEligible: boolean;
}

export interface ValidatedCart extends PriceBreakdown {
  lines: { product: Product; quantity: number; variant?: string; lineTotal: number }[];
  coupon?: { code: string; type: 'percentage' | 'flat'; value: number; discount: number };
}

export interface CheckoutResultStripe {
  order: Order;
  gateway: 'stripe';
  clientSecret: string;
  paymentIntentId: string;
}
export interface CheckoutResultRazorpay {
  order: Order;
  gateway: 'razorpay';
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}
export interface CheckoutResultCod {
  order: Order;
  gateway: 'cod';
}
export type CheckoutResult = CheckoutResultStripe | CheckoutResultRazorpay | CheckoutResultCod;

/** Standard API envelope. */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  errors?: Record<string, string>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export type Paginated<T> = { items: T[]; meta: PaginationMeta };

// --- Admin ----------------------------------------------------------------

export interface DashboardStats {
  revenue: number;
  ordersCount: number;
  avgOrderValue: number;
  ordersToday: number;
  customersCount: number;
  customersToday: number;
  productsCount: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  categoriesCount: number;
  couponsCount: number;
  recentOrders: Order[];
}

export interface TrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}