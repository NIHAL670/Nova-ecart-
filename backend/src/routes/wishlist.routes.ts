/**
 * Wishlist routes — all protected (requires login).
 */
import { Router } from 'express';
import * as wishlist from '../controllers/wishlist.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { addToWishlistSchema } from '../validators/wishlist.validator';

const router = Router();

router.use(authenticate);

router.get('/', wishlist.get);
router.post('/toggle', validate({ body: addToWishlistSchema }), wishlist.toggle);
router.get('/check/:productId', wishlist.check);
router.delete('/clear', wishlist.clear);
router.delete('/:productId', wishlist.remove);

export default router;