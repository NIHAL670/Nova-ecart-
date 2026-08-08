/**
 * Category routes. Reads are public; writes require admin.
 */
import { Router } from 'express';
import * as category from '../controllers/category.controller';
import { validate } from '../middlewares/validate';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '../types/enums';
import { createCategorySchema, updateCategorySchema, categoryIdParams } from '../validators/category.validator';

const router = Router();

// Public
router.get('/', category.list);
router.get('/tree', category.tree);
router.get('/slug/:slug', category.getBySlug);
router.get('/:id', validate({ params: categoryIdParams }), category.getById);

// Admin-only
router.use(authenticate, authorize(Role.ADMIN));
router.post('/', validate({ body: createCategorySchema }), category.create);
router.patch('/:id', validate({ params: categoryIdParams, body: updateCategorySchema }), category.update);
router.delete('/:id', validate({ params: categoryIdParams }), category.remove);

export default router;