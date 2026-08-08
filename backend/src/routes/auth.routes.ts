/**
 * Auth routes. `/me` is protected; the rest are public (with a strict limiter
 * to slow brute-force attempts).
 */
import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), auth.register);
router.post('/register/verify-email', authLimiter, validate({ body: verifyOtpSchema }), auth.verifyEmail);
router.post('/register/resend-otp', authLimiter, validate({ body: resendOtpSchema }), auth.resendOtp);
router.post('/login', authLimiter, validate({ body: loginSchema }), auth.login);
router.post('/refresh-token', authLimiter, validate({ body: refreshTokenSchema }), auth.refresh);
router.post('/logout', authenticate, auth.logout);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), auth.forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), auth.resetPassword);
router.get('/me', authenticate, auth.me);

export default router;