/**
 * Checkout orchestration — creates the order via order.service then initiates
 * the chosen payment gateway. Returns whatever the client needs to complete
 * payment (Stripe client_secret / Razorpay order id / nothing for COD).
 *
 * Stock is decremented when the order is created (reserved) and restored if
 * the payment ultimately fails or is cancelled.
 */
import { Order, IOrder } from '../models';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../types/enums';
import { ApiError } from '../utils/ApiError';
import { placeOrder, restoreStock } from './order.service';
import { createStripeCheckout } from '../config/stripe';
import { createRazorpayOrder } from '../config/razorpay';
import { env } from '../config/env';

export type CheckoutResult =
  | { order: IOrder; gateway: 'stripe'; clientSecret: string; paymentIntentId: string }
  | { order: IOrder; gateway: 'razorpay'; razorpayOrderId: string; amount: number; currency: string; keyId: string }
  | { order: IOrder; gateway: 'cod' };

export async function initCheckout(input: {
  userId: string;
  items: { productId: string; quantity: number; variant?: string }[];
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
  currency?: string;
}): Promise<CheckoutResult> {
  const order = await placeOrder({
    userId: input.userId,
    items: input.items,
    shippingAddressId: input.shippingAddressId,
    paymentMethod: input.paymentMethod,
    couponCode: input.couponCode,
    notes: input.notes,
  });

  switch (input.paymentMethod) {
    case PaymentMethod.COD: {
      order.status = OrderStatus.PLACED;
      order.timeline.push({ status: OrderStatus.PLACED, at: new Date(), note: 'Order placed (Cash on Delivery)' });
      await order.save();
      return { order, gateway: 'cod' };
    }

    case PaymentMethod.STRIPE: {
      const payment = await createStripeCheckout({
        orderId: String(order._id),
        amount: order.total,
        currency: order.currency,
        metadata: { orderNumber: order.orderNumber, userId: input.userId },
      });
      order.gatewayOrderId = payment.paymentIntentId;
      await order.save();
      return { order, gateway: 'stripe', clientSecret: payment.clientSecret!, paymentIntentId: payment.paymentIntentId };
    }

    case PaymentMethod.RAZORPAY: {
      const rzp = await createRazorpayOrder({
        orderId: order.orderNumber,
        amount: order.total,
        receipt: order.orderNumber,
      });
      order.gatewayOrderId = rzp.orderId;
      await order.save();
      return {
        order,
        gateway: 'razorpay',
        razorpayOrderId: rzp.orderId,
        amount: rzp.amount,
        currency: rzp.currency,
        keyId: env.RAZORPAY_KEY_ID ?? '',
      };
    }

    default:
      throw ApiError.badRequest('Unsupported payment method');
  }
}

/** Mark an order paid + confirmed after a successful gateway webhook. */
export async function markOrderPaid(orderId: string): Promise<IOrder> {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order');
  if (order.paymentStatus === PaymentStatus.PAID) return order; // idempotent

  order.paymentStatus = PaymentStatus.PAID;
  if (order.status === OrderStatus.PENDING) order.status = OrderStatus.CONFIRMED;
  order.timeline.push({ status: order.status, at: new Date(), note: 'Payment confirmed' });
  await order.save();
  return order;
}

/** Mark an order failed + restore reserved stock (webhook / gateway failure). */
export async function markOrderPaymentFailed(orderId: string): Promise<IOrder> {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order');
  if (order.paymentStatus === PaymentStatus.PAID) return order;

  order.paymentStatus = PaymentStatus.FAILED;
  if (order.status === OrderStatus.PENDING) order.status = OrderStatus.CANCELLED;
  order.timeline.push({ status: order.status, at: new Date(), note: 'Payment failed' });
  await order.save();
  if (order.paymentStatus === PaymentStatus.FAILED) await restoreStock(order);
  return order;
}

export { PaymentMethod, env };