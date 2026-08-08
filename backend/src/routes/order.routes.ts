/**
 * Order routes — protected. Checkout is a single POST that creates the order
 * and initiates the chosen payment gateway.
 */
import { Router } from 'express';
import * as order from '../controllers/order.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { checkoutSchema, validateCartSchema, orderParams, orderNumberParams } from '../validators/order.validator';

const router = Router();

router.use(authenticate);

router.post('/cart/validate', validate({ body: validateCartSchema }), order.validateCart);
router.post('/checkout', validate({ body: checkoutSchema }), order.checkout);
router.get('/my-orders', order.listMyOrders);
router.get('/order-number/:orderNumber', validate({ params: orderNumberParams }), order.getByNumber);
router.get('/:id', validate({ params: orderParams }), order.getById);
router.post('/:id/cancel', validate({ params: orderParams }), order.cancel);

export default router;