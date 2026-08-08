/**
 * Route barrel — app.ts imports one bundled router set.
 */
import { Router } from 'express';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import reviewRoutes from './review.routes';
import wishlistRoutes from './wishlist.routes';
import addressRoutes from './address.routes';
import couponRoutes from './coupon.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/reviews', reviewRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/addresses', addressRoutes);
router.use('/coupons', couponRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;