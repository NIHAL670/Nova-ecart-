/**
 * User profile business logic — updating account details and password.
 */
import { User, IUser } from '../models';
import { ApiError } from '../utils/ApiError';

function sanitize(user: IUser) {
  const obj = user.toJSON() as Record<string, unknown>;
  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
}

export async function updateProfile(userId: string, input: { name?: string; phone?: string; avatar?: string }): Promise<Record<string, unknown>> {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User');

  if (input.name) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone;
  if (input.avatar) user.avatar = input.avatar;
  await user.save();
  return sanitize(user);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User');

  const matches = await user.comparePassword(currentPassword);
  if (!matches) throw ApiError.badRequest('Current password is incorrect');

  user.password = newPassword; // pre-save hook hashes it
  user.refreshToken = undefined; // revoke all sessions
  await user.save();
}

export async function updateAvatar(userId: string, avatarUrl: string | undefined): Promise<Record<string, unknown>> {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User');

  if (user.avatar) {
    const { deleteImage } = await import('../utils/upload');
    await deleteImage(undefined, user.avatar).catch(() => undefined);
  }

  user.avatar = avatarUrl || undefined;
  await user.save();
  return sanitize(user);
}