/**
 * User profile handlers (protected).
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';
import * as service from '../services/user.service';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.updateProfile(req.user!.id, req.body);
  res.json(ok(user, 'Profile updated'));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await service.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  res.json(ok(null, 'Password changed successfully. Please log in again.'));
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return void res.status(400).json({ success: false, message: 'No file uploaded' });
  const { storeImage } = await import('../utils/upload');
  const stored = await storeImage(file);
  const user = await service.updateAvatar(req.user!.id, stored.url);
  res.json(ok(user, 'Avatar updated'));
});

export const removeAvatar = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.updateAvatar(req.user!.id, undefined);
  res.json(ok(user, 'Avatar removed'));
});