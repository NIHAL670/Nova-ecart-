/**
 * Address routes — all protected.
 */
import { Router } from 'express';
import * as address from '../controllers/address.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { createAddressSchema, updateAddressSchema, addressParams } from '../validators/address.validator';

const router = Router();

router.use(authenticate);

router.get('/', address.list);
router.post('/', validate({ body: createAddressSchema }), address.create);
router.get('/:id', validate({ params: addressParams }), address.getById);
router.patch('/:id', validate({ params: addressParams, body: updateAddressSchema }), address.update);
router.delete('/:id', validate({ params: addressParams }), address.remove);
router.post('/:id/default', validate({ params: addressParams }), address.setDefault);

export default router;