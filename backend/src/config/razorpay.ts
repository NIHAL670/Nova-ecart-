/**
 * Razorpay gateway helpers.
 *
 * The server-side flow:
 *   1. `createRazorpayOrder()` -> Razorpay order id + amount
 *   2. Frontend opens Razorpay Checkout with that order id + key id
 *   3. `verifyRazorpaySignature()` confirms the returned signature
 *   4. Razorpay webhook marks the order paid
 */
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from './env';

function getRazorpay(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing)');
  }
  return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

export async function createRazorpayOrder(args: {
  orderId: string;
  amount: number; // in rupees
  currency?: string;
  receipt?: string;
}): Promise<{ orderId: string; amount: number; currency: string; receipt: string }> {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(args.amount * 100), // paise (minor units)
    currency: args.currency ?? 'INR',
    receipt: args.receipt ?? args.orderId,
    notes: { orderId: args.orderId },
  });
  return { orderId: order.id, amount: args.amount, currency: order.currency, receipt: order.receipt ?? '' };
}

/**
 * Verify the `razorpay_signature` returned by the checkout popup.
 * HMAC-SHA256 over `{order_id}|{payment_id}` using the key secret.
 */
export function verifyRazorpaySignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET ?? '')
    .update(`${args.orderId}|${args.paymentId}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(args.signature));
}

/** Signature used by the Razorpay webhook to authenticate events. */
export function verifyRazorpayWebhookSignature(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET ?? '')
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}