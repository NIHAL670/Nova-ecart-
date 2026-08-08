/**
 * Auth HTTP handlers — thin wrappers over auth.service. Cookie setting lives
 * here (HTTP layer), business logic lives in the service layer.
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from '../utils/tokens';
import * as authService from '../services/auth.service';
import { isSmtpConfigured } from '../config/nodemailer';

/** Attach the httpOnly refresh cookie. */
function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}
function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user } = await authService.registerUser(req.body);
  res.status(201).json(
    ok(
      { user, requiresOtp: true },
      'Registration successful. Please verify with the OTP sent to your phone number.',
    ),
  );
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await authService.verifyEmailOtp(req.body.email, req.body.otp);
  res.json(ok(null, 'Email verified successfully. You can now log in.'));
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  await authService.resendSignupOtp(req.body.email);
  res.json(ok(null, 'A new OTP has been sent.'));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, user } = await authService.loginUser(req.body.email, req.body.password);
  setRefreshCookie(res, refreshToken);
  res.json(ok({ user, accessToken }, 'Logged in successfully'));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const incoming = req.body.refreshToken ?? req.cookies?.[REFRESH_COOKIE_NAME];
  if (!incoming) return void res.status(401).json({ success: false, message: 'No refresh token provided' });

  const { accessToken, refreshToken, user } = await authService.refreshAccessToken(incoming);
  setRefreshCookie(res, refreshToken);
  res.json(ok({ user, accessToken, refreshToken }, 'Token refreshed'));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) await authService.logoutUser(req.user.id);
  clearRefreshCookie(res);
  res.json(ok(null, 'Logged out successfully'));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res.json(ok(null, 'If the account exists, a reset OTP has been sent.'));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.email, req.body.otp, req.body.newPassword);
  res.json(ok(null, 'Password reset successfully. You can now log in.'));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  res.json(ok(user, 'Profile fetched'));
});