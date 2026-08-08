/**
 * Review routes. Listing is public; write/update/delete require auth (admins
 * can delete anyone's review).
 */
import { Router } from 'express';
import * as review from '../controllers/review.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { createReviewSchema, updateReviewSchema, listReviewsQuery, reviewParams } from '../validators/review.validator';

const router = Router();

router.get('/', validate({ query: listReviewsQuery }), review.list);
router.get('/:id', validate({ params: reviewParams }), review.getById);

router.use(authenticate);
router.post('/', validate({ body: createReviewSchema }), review.create);
router.patch('/:id', validate({ params: reviewParams, body: updateReviewSchema }), review.update);
router.delete('/:id', validate({ params: reviewParams }), review.remove);

export default router;