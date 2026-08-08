/**
 * Centralised axios client.
 *
 * - Base URL from NEXT_PUBLIC_API_URL
 * - Attaches the access token from the persisted auth store (read via
 *   localStorage to avoid circular imports with the store itself)
 * - Unwraps `{ data }` so callers get the payload directly
 * - On 401, attempts ONE silent refresh (httpOnly cookie is sent because
 *   withCredentials is on), then retries the original request.
 */
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { api, storageKeys } from '@/constants';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export interface ApiErrorPayload {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

function readToken(): string | null {
  try {
    const raw = localStorage.getItem(storageKeys.auth);
    if (!raw) return null;
    return (JSON.parse(raw) as { state: { accessToken?: string } }).state?.accessToken ?? null;
  } catch {
    return null;
  }
}

function writeToken(token: string): void {
  try {
    const raw = localStorage.getItem(storageKeys.auth);
    const parsed = raw ? JSON.parse(raw) : { state: {} };
    parsed.state = { ...(parsed.state ?? {}), accessToken: token };
    localStorage.setItem(storageKeys.auth, JSON.stringify(parsed));
  } catch {
    // ignore storage errors
  }
}

export const client = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send httpOnly refresh cookie
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Normalise backend errors into a throwable ApiError with a friendly message. */
export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorPayload | undefined;
    return data?.message ?? err.message ?? 'Something went wrong';
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}

export function getFieldErrors(err: unknown): Record<string, string> | undefined {
  if (err instanceof ApiError) return err.fieldErrors;
  if (axios.isAxiosError(err)) return (err.response?.data as ApiErrorPayload | undefined)?.errors;
  return undefined;
}

let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const res = await axios.post(`${API_URL}${api.auth.refresh}`, {}, { withCredentials: true, timeout: 15_000 });
    const token = (res.data as { data: { accessToken: string } }).data.accessToken;
    writeToken(token);
    return token;
  })()
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

let onUnauthorized: (() => void) | null = null;
/** Register a callback invoked when a silent refresh fails (used to force logout). */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const data = error.response?.data as ApiErrorPayload | undefined;

    // 401 + not the refresh endpoint itself + not retried yet -> try once.
    if (status === 401 && original && !original._retried && !original.url?.includes('/auth/refresh-token')) {
      // No access token to refresh (e.g. already logged out). Fail fast instead
      // of entering a refresh -> logout -> redirect loop that hammers the API.
      if (!readToken()) {
        throw new ApiError(status, data?.message ?? 'Unauthorized', data?.errors);
      }
      try {
        original._retried = true;
        const token = await refreshAccessToken();
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` };
        return client(original);
      } catch {
        onUnauthorized?.();
        throw new ApiError(401, 'Your session has expired. Please log in again.');
      }
    }

    throw new ApiError(status ?? 500, data?.message ?? error.message ?? 'Something went wrong', data?.errors);
  },
);

/** Typed GET returning `T` directly from the envelope. */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.get(url, config);
  return (res.data as { data: T }).data;
}

/** GET that also surfaces pagination `meta` from the envelope. */
export async function getWithMeta<T>(url: string, config?: AxiosRequestConfig): Promise<{ data: T; meta?: import('@/types').PaginationMeta }> {
  const res = await client.get(url, config);
  const envelope = res.data as { data: T; meta?: import('@/types').PaginationMeta };
  return { data: envelope.data, meta: envelope.meta };
}

/** Typed POST. */
export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.post(url, body, config);
  return (res.data as { data: T }).data;
}

/** Typed PATCH. */
export async function patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.patch(url, body, config);
  return (res.data as { data: T }).data;
}

/** Typed DELETE. */
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.delete(url, config);
  return (res.data as { data: T }).data;
}


