/**
 * Product routes. Reads are public (with query validation for the list).
 * Admin writes support multipart image uploads.
 */
import { Router } from 'express';
import * as product from '../controllers/product.controller';
import { validate } from '../middlewares/validate';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../utils/upload';
import { Role } from '../types/enums';
import { listProductsQuery, upsertProductSchema, productIdParams } from '../validators/product.validator';

const router = Router();

// Public
router.get('/', validate({ query: listProductsQuery }), product.list);
router.get('/featured', product.featured);
router.get('/best-sellers', product.bestSellers);
router.get('/latest', product.latest);
router.get('/offers', product.offers);
router.get('/trending', product.trending);
router.get('/suggestions', product.suggestions);
router.get('/slug/:slug', product.getBySlug);
router.get('/:id', validate({ params: productIdParams }), product.getById);
router.get('/:id/related', validate({ params: productIdParams }), product.related);

// Admin-only
router.use(authenticate, authorize(Role.ADMIN));
router.post('/', upload.array('images', 8), validate({ body: upsertProductSchema }), product.create);
router.patch('/:id', upload.array('images', 8), validate({ params: productIdParams, body: upsertProductSchema.partial() }), product.update);
router.delete('/:id', validate({ params: productIdParams }), product.remove);

export default router;