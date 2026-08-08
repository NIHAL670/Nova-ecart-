import { patch, post, del } from '@/lib/api';
import { api } from '@/constants';
import type { User } from '@/types';

export async function updateProfile(input: { name?: string; phone?: string; avatar?: string }): Promise<User> {
  return patch<User>(api.users.profile, input);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<null> {
  return patch<null>(api.users.password, { currentPassword, newPassword });
}

export async function uploadAvatar(file: File): Promise<User> {
  const form = new FormData();
  form.append('avatar', file);
  return post<User>(api.users.avatar, form, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export async function removeAvatar(): Promise<User> {
  return del<User>(api.users.avatar);
}