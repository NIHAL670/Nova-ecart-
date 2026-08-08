/**
 * Coupon routes. Validation is public; listing/management is admin-only.
 */
import { Router } from 'express';
import * as coupon from '../controllers/coupon.controller';
import { validate } from '../middlewares/validate';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '../types/enums';
import { createCouponSchema, updateCouponSchema, validateCouponQuery, couponParams } from '../validators/coupon.validator';

const router = Router();

// Public
router.get('/validate', validate({ query: validateCouponQuery }), coupon.validate);

// Admin-only
router.use(authenticate, authorize(Role.ADMIN));
router.get('/', coupon.list);
router.get('/:id', validate({ params: couponParams }), coupon.getById);
router.post('/', validate({ body: createCouponSchema }), coupon.create);
router.patch('/:id', validate({ params: couponParams, body: updateCouponSchema }), coupon.update);
router.delete('/:id', validate({ params: couponParams }), coupon.remove);

export default router;