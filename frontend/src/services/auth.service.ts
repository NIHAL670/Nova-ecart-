import { get, post } from '@/lib/api';
import { api } from '@/constants';
import type { AuthResponse, User } from '@/types';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  countryCode?: string;
}

export async function register(input: RegisterInput) {
  return post<{ user: User; requiresOtp: boolean }>(api.auth.register, input);
}

export async function verifyEmail(email: string, otp: string) {
  return post<null>(api.auth.verifyEmail, { email, otp, purpose: 'signup' });
}

export async function resendOtp(email: string) {
  return post<null>(api.auth.resendOtp, { email, purpose: 'signup' });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return post<AuthResponse>(api.auth.login, { email, password });
}

export async function logout(): Promise<null> {
  return post<null>(api.auth.logout);
}

export async function forgotPassword(email: string) {
  return post<null>(api.auth.forgotPassword, { email });
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  return post<null>(api.auth.resetPassword, { email, otp, newPassword });
}

export async function fetchMe(): Promise<User> {
  return get<User>(api.auth.me);
}