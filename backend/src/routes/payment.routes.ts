/**
 * Payment webhook routes — public, called by Stripe / Razorpay. Signature
 * verification happens inside the handlers; never route these behind auth.
 */
import { Router } from 'express';
import * as payment from '../controllers/payment.controller';

const router = Router();

router.post('/webhook/stripe', payment.stripeWebhook);
router.post('/webhook/razorpay', payment.razorpayWebhook);

export default router;