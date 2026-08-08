/**
 * User routes — protected.
 */
import { Router } from 'express';
import * as user from '../controllers/user.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { upload } from '../utils/upload';
import { updateProfileSchema, changePasswordSchema } from '../validators/user.validator';

const router = Router();

router.use(authenticate);

router.patch('/profile', validate({ body: updateProfileSchema }), user.updateProfile);
router.patch('/password', validate({ body: changePasswordSchema }), user.changePassword);
router.post('/avatar', upload.single('avatar'), user.uploadAvatar);
router.delete('/avatar', user.removeAvatar);

export default router;