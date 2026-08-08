/**
 * Stripe gateway helpers. All calls are wrapped so missing credentials throw
 * a clear error instead of failing half-way through a checkout.
 */
import Stripe from 'stripe';
import { env } from './env';

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing)');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });
}

/**
 * Create a payment-intent checkout session. Returns the client secret the
 * browser needs to complete Stripe.js payment, plus the amount in cents.
 */
export async function createStripeCheckout(args: {
  orderId: string;
  amount: number; // in dollars
  currency?: string;
  metadata?: Record<string, string>;
}): Promise<{ clientSecret: string | null; paymentIntentId: string }> {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(args.amount * 100), // Stripe expects minor units
    currency: args.currency ?? 'usd',
    metadata: { orderId: args.orderId, ...(args.metadata ?? {}) },
    automatic_payment_methods: { enabled: true },
  });
  return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
}

/** Verify + parse a Stripe webhook payload using the signing secret. */
export function constructStripeEvent(payload: Buffer, signature: string): Stripe.Event {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return getStripe().webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
}