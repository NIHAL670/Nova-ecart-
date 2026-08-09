/**
 * Authentication business logic.
 *
 * Refresh-token strategy: a JWT refresh token is stored on the user document
 * at login. On every refresh the incoming token must match the stored one, then
 * a brand-new pair is issued and the stored value rotated. Logout deletes the
 * stored token, which instantly invalidates the refresh token (revocation).
 */
import { Otp, IUser } from '../models';
import { User } from '../models/User';
import { Role, OtpPurpose } from '../types/enums';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens';
import { createAndSendOtp, verifyOtp } from './otp.service';
import { env } from '../config/env';

export interface AuthResult {
  user: ReturnType<typeof sanitizeUser>;
  accessToken: string;
  refreshToken: string;
}

function sanitizeUser(user: IUser) {
  const obj = user.toJSON() as Record<string, unknown>;
  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
}

export async function registerUser(input: { name: string; email: string; password: string; phone?: string; countryCode?: string }) {
  if (!input.phone || !/^\d{10}$/.test(input.phone)) {
    throw ApiError.badRequest('number not correct');
  }
  const existing = await User.findOne({ email: input.email });
  if (existing) throw ApiError.badRequest('An account with this email already exists');

  const countryCode = input.countryCode || '+91';
  const fullPhone = countryCode + input.phone;

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    phone: fullPhone,
    isEmailVerified: false,
  });
  const devCode = await createAndSendOtp(user.email, OtpPurpose.SIGNUP);

  return {
    user: sanitizeUser(user),
    devCode,
  };
}

export async function verifyEmailOtp(email: string, code: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user || !user.phone || user.phone.trim() === '') {
    throw ApiError.badRequest('number not correct');
  }
  await verifyOtp(email, code, OtpPurpose.SIGNUP);
  await User.updateOne({ email }, { $set: { isEmailVerified: true } });
}

export async function resendSignupOtp(email: string) {
  const user = await User.findOne({ email });
  if (!user || !user.phone || user.phone.trim() === '') {
    throw ApiError.badRequest('number not correct');
  }
  return createAndSendOtp(email, OtpPurpose.SIGNUP);
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) throw ApiError.unauthorized('Invalid email or password');

  // Require email verification before login.
  if (!user.isEmailVerified) {
    throw ApiError.forbidden('Please verify your email before logging in');
  }

  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  user.refreshToken = refreshToken;
  await user.save();

  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken,
  };
}

export async function refreshAccessToken(incomingRefresh: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
  const payload = verifyRefreshToken(incomingRefresh);
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');

  // Rotation: the incoming token must be the latest one we issued.
  if (!user.refreshToken || user.refreshToken !== incomingRefresh) {
    // Token reuse detected — force logout of all sessions.
    user.refreshToken = undefined;
    await user.save();
    throw ApiError.unauthorized('Refresh token has been revoked');
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken, user: sanitizeUser(user) };
}

export async function logoutUser(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
}

export async function forgotPassword(email: string): Promise<string> {
  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('Account');
  return createAndSendOtp(email, OtpPurpose.FORGOT_PASSWORD);
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  await verifyOtp(email, code, OtpPurpose.FORGOT_PASSWORD);
  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('Account');

  user.password = newPassword;
  user.refreshToken = undefined;
  await user.save();
}

export async function getProfile(userId: string) {
  const user = await User.findById(userId).populate('addresses');
  if (!user) throw ApiError.notFound('User');
  return sanitizeUser(user);
}

/** Admin bootstrap helper used by the seed script. */
export async function findOrCreateAdmin(): Promise<void> {
  const existing = await User.findOne({ email: env.ADMIN_EMAIL });
  if (existing) return;
  await User.create({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    role: Role.ADMIN,
    isEmailVerified: true,
  });
  // eslint-disable-next-line no-console
  console.log(`👤 Bootstrap admin created: ${env.ADMIN_EMAIL}`);
}

export { Role };
export { Otp };
