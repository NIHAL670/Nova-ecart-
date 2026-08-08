import { get, post, getWithMeta } from '@/lib/api';
import { api } from '@/constants';
import type { CartItem, Order, PaymentMethod, CheckoutResult, ValidatedCart, PaginationMeta } from '@/types';

export async function validateCart(items: CartItem[], couponCode?: string): Promise<ValidatedCart> {
  return post<ValidatedCart>(api.orders.validateCart, { items: items.map(({ productId, quantity, variant }) => ({ productId, quantity, variant })), couponCode });
}

export interface CheckoutInput {
  items: CartItem[];
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
}

export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  return post<CheckoutResult>(api.orders.checkout, {
    items: input.items.map(({ productId, quantity, variant }) => ({ productId, quantity, variant })),
    shippingAddressId: input.shippingAddressId,
    paymentMethod: input.paymentMethod,
    couponCode: input.couponCode,
    notes: input.notes,
  });
}

export async function fetchMyOrders(page = 1): Promise<{ items: Order[]; meta: PaginationMeta }> {
  const { data, meta } = await getWithMeta<Order[]>(`${api.orders.myOrders}?page=${page}`);
  return { items: data, meta: meta as PaginationMeta };
}

export async function fetchOrderById(id: string): Promise<Order> {
  return get<Order>(api.orders.byId(id));
}

export async function fetchOrderByNumber(orderNumber: string): Promise<Order> {
  return get<Order>(api.orders.byNumber(orderNumber));
}

export async function cancelOrder(id: string): Promise<Order> {
  return post<Order>(api.orders.cancel(id));
}