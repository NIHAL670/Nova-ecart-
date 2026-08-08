/**
 * Payment webhooks.
 *
 * Endpoints receive RAW bodies (never JSON-parsed) so signature verification
 * operates on the exact payload. Both handlers are idempotent — a duplicate
 * webhook for the same payment is a no-op.
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { constructStripeEvent } from '../config/stripe';
import { verifyRazorpayWebhookSignature } from '../config/razorpay';
import { markOrderPaid, markOrderPaymentFailed } from '../services/checkout.service';
import { env } from '../config/env';

export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string | undefined;
  if (!signature) return void res.status(400).json({ success: false, message: 'Missing signature' });

  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.from('');
  const event = constructStripeEvent(rawBody, signature);

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as { metadata?: { orderId?: string } };
      if (intent.metadata?.orderId) await markOrderPaid(intent.metadata.orderId);
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as { metadata?: { orderId?: string } };
      if (intent.metadata?.orderId) await markOrderPaymentFailed(intent.metadata.orderId);
      break;
    }
    default:
      break; // ignore unrelated events
  }

  res.json({ received: true });
});

export const razorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) return void res.status(400).json({ success: false, message: 'Missing signature' });

  const payload = (req as unknown as { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(req.body);
  if (!verifyRazorpayWebhookSignature(payload, signature as string)) {
    return void res.status(401).json({ success: false, message: 'Invalid signature' });
  }

  const event = req.body.event as string;
  const entity = req.body.payload?.payment?.entity as { notes?: { orderId?: string } };

  switch (event) {
    case 'payment.captured':
    case 'payment.authorized': {
      if (entity?.notes?.orderId) await markOrderPaid(entity.notes.orderId);
      break;
    }
    case 'payment.failed': {
      if (entity?.notes?.orderId) await markOrderPaymentFailed(entity.notes.orderId);
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
});

export { env };