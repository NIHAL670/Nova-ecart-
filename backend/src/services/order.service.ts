/**
 * Order business logic.
 *
 * Checkout pipeline (all server-authoritative — the client can never dictate
 * prices):
 *   1. loadCart    — fetch products, verify stock, compute line totals
 *   2. applyCoupon — validate code, compute discount (scope-checked)
 *   3. computeTotals — subtotal - discount + shipping + tax
 *   4. create order snapshot, decrement stock, bump soldCount & coupon usage
 *   5. payment leg (COD direct / Stripe / Razorpay intent) lives in checkout.service
 */
import { Order, Product, Address, Coupon, IOrder, IProduct, IAddress } from '../models';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../types/enums';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { validateCoupon } from './coupon.service';

// ---------------------------------------------------------------------------

export interface CartLine {
  product: IProduct;
  quantity: number;
  variant?: string;
  lineTotal: number;
}

export interface PriceBreakdown {
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  taxRate: number;
  total: number;
}

export interface ValidatedCart extends PriceBreakdown {
  lines: CartLine[];
  coupon?: { code: string; type: 'percentage' | 'flat'; value: number; discount: number };
  shippingEligible: boolean;
}

/** Deterministic order number like `NC-20260803-7F3K2`. */
export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NC-${date}-${rand}`;
}

/** Load products for cart items and return priced lines (throws on bad stock). */
export async function loadCart(items: { productId: string; quantity: number; variant?: string }[]): Promise<{ lines: CartLine[]; subtotal: number }> {
  const ids = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines: CartLine[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product || product.status !== 'active' || product.deletedAt) throw ApiError.badRequest(`Product no longer available`);
    if (product.stock < item.quantity) {
      throw ApiError.badRequest(`Only ${product.stock} unit(s) left in stock for "${product.name}"`);
    }

    let unitPrice = product.discountedPrice ?? product.price;
    // Variant pricing override (if a matching variant is chosen).
    if (item.variant) {
      const variant = product.variants.find((v) => v.name === item.variant);
      if (!variant) throw ApiError.badRequest(`Variant "${item.variant}" not found`);
      if (variant.stock < item.quantity) throw ApiError.badRequest(`Variant "${item.variant}" is out of stock`);
      unitPrice = variant.price ?? unitPrice;
    }

    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    subtotal += lineTotal;
    lines.push({
      product,
      quantity: item.quantity,
      variant: item.variant,
      lineTotal: Math.round(lineTotal * 100) / 100,
    });
  }

  return { lines, subtotal: Math.round(subtotal * 100) / 100 };
}

/**
 * Full cart validation used by GET /cart/validate and internally by checkout.
 * Accepts an optional coupon code; shipping + tax are derived from env defaults.
 */
export async function validateCart(input: { items: { productId: string; quantity: number; variant?: string }[]; couponCode?: string }): Promise<ValidatedCart> {
  const { lines, subtotal } = await loadCart(input.items);

  let discount = 0;
  let coupon;
  if (input.couponCode) {
    const productIds = lines.map((l) => String(l.product._id));
    const categoryIds = [...new Set(lines.map((l) => String(l.product.category)))];
    const validation = await validateCoupon(input.couponCode, { subtotal, productIds, categoryIds });
    discount = validation.discount;
    coupon = {
      code: validation.coupon.code,
      type: validation.coupon.type,
      value: validation.coupon.value,
      discount,
    };
  }

  const shippingEligible = subtotal - discount >= env.FREE_SHIPPING_THRESHOLD;
  const shippingFee = shippingEligible ? 0 : env.STANDARD_SHIPPING_FEE;

  const tax = Math.round((subtotal - discount) * env.DEFAULT_TAX_RATE * 100) / 100;
  const total = Math.round((subtotal - discount + shippingFee + tax) * 100) / 100;

  return { lines, subtotal, discount, shippingFee, tax, taxRate: env.DEFAULT_TAX_RATE, total, coupon, shippingEligible };
}

function snapshotAddress(address: IAddress) {
  return {
    name: address.name,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  };
}

/**
 * Persist an order document from a validated cart. Decrements stock and bumps
 * sales/coupon counters. Returns the created order.
 */
export async function placeOrder(input: {
  userId: string;
  items: { productId: string; quantity: number; variant?: string }[];
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
}): Promise<IOrder> {
  const address = await Address.findOne({ _id: input.shippingAddressId, user: input.userId });
  if (!address) throw ApiError.notFound('Shipping address');

  const cart = await validateCart({ items: input.items, couponCode: input.couponCode });

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: input.userId,
    items: cart.lines.map((l) => ({
      product: l.product._id,
      name: l.product.name,
      image: l.product.images[0]?.url ?? '',
      sku: l.product.sku,
      unitPrice: l.product.discountedPrice ?? l.product.price,
      quantity: l.quantity,
      total: l.lineTotal,
      variant: l.variant,
    })),
    shippingAddress: snapshotAddress(address),
    coupon: cart.coupon,
    currency: cart.lines[0]?.product.currency ?? 'USD',
    subtotal: cart.subtotal,
    discount: cart.discount,
    shippingFee: cart.shippingFee,
    tax: cart.tax,
    taxRate: cart.taxRate,
    total: cart.total,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.PENDING,
    notes: input.notes,
    status: OrderStatus.PENDING,
    timeline: [{ status: OrderStatus.PENDING, at: new Date() }],
  });

  await decrementStock(cart.lines);
  await Promise.all(cart.lines.map((l) => Product.findByIdAndUpdate(l.product._id, { $inc: { soldCount: l.quantity } })));
  if (cart.coupon) await incrementCouponUsage(cart.coupon.code);

  return order;
}

async function decrementStock(lines: { product: IProduct; quantity: number; variant?: string }[]): Promise<void> {
  for (const line of lines) {
    if (line.variant) {
      await Product.updateOne(
        { _id: line.product._id, 'variants.name': line.variant },
        { $inc: { 'variants.$.stock': -line.quantity, stock: -line.quantity } },
      );
    } else {
      await Product.findByIdAndUpdate(line.product._id, { $inc: { stock: -line.quantity } });
    }
  }
}

async function incrementCouponUsage(code: string): Promise<void> {
  await Coupon.updateOne({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
}

// --- Queries ----------------------------------------------------------------

export async function listMyOrders(userId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments({ user: userId }),
  ]);
  return { orders, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function getOrderById(id: string, userId?: string, isAdmin = false): Promise<IOrder> {
  const query = isAdmin ? { _id: id } : { _id: id, user: userId };
  const order = await Order.findOne(query).populate('user', 'name email phone');
  if (!order) throw ApiError.notFound('Order');
  return order;
}

export async function getOrderByNumber(orderNumber: string, userId: string): Promise<IOrder> {
  const order = await Order.findOne({ orderNumber, user: userId });
  if (!order) throw ApiError.notFound('Order');
  return order;
}

/** User-initiated cancellation — only allowed before shipping. */
export async function cancelOrder(userId: string, orderId: string): Promise<IOrder> {
  const order = await getOrderById(orderId, userId);
  if (![OrderStatus.PENDING, OrderStatus.PLACED, OrderStatus.CONFIRMED].includes(order.status)) {
    throw ApiError.badRequest('Order can no longer be cancelled');
  }
  order.status = OrderStatus.CANCELLED;
  order.timeline.push({ status: OrderStatus.CANCELLED, at: new Date(), note: 'Cancelled by customer' });
  await order.save();
  await restoreStock(order);
  return order;
}

/** Restore stock for cancelled/refunded orders. */
export async function restoreStock(order: IOrder): Promise<void> {
  for (const item of order.items) {
    if (item.variant) {
      await Product.updateOne(
        { _id: item.product, 'variants.name': item.variant },
        { $inc: { 'variants.$.stock': item.quantity, stock: item.quantity, soldCount: -item.quantity } },
      );
    } else {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, soldCount: -item.quantity } });
    }
  }
}

// --- Admin ---------------------------------------------------------------

export async function adminListOrders(query: { page?: number; limit?: number; status?: OrderStatus; search?: string }) {
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
}

export async function adminUpdateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<IOrder> {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order');

  const prev = order.status;
  order.status = status;
  order.timeline.push({ status, at: new Date(), note });
  await order.save();

  // Restore stock when cancelled/refunded, unless we already restored it.
  if ((status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED) && ![OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(prev)) {
    await restoreStock(order);
  }
  return order;
}

export { PaymentStatus };