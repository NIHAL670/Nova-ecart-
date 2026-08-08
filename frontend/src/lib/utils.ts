import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Currency formatter — USD default, INR supported. */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Compact currency for dashboard stat tiles (e.g. $1.2k). */
export function formatCompact(value: number, currency: string = 'USD'): string {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
  return value.toFixed(0);
}

/** Date/time formatter. */
export function formatDate(input: string | number | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', opts ?? { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(input));
}

export function formatDateTime(input: string | number | Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(input));
}

/** Human "time ago" helper for reviews / orders. */
export function timeAgo(input: string | number | Date): string {
  const seconds = Math.floor((Date.now() - new Date(input).getTime()) / 1000);
  const units: [number, string][] = [
    [60, 'minute'],
    [3600, 'hour'],
    [86400, 'day'],
    [86400 * 30, 'month'],
    [86400 * 365, 'year'],
  ];
  let value = seconds;
  let unit = 'second';
  for (const [secs, name] of units) {
    if (seconds < secs) break;
    value = Math.floor(seconds / secs);
    unit = name;
  }
  return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
}

/** Truncate a string to `len` chars with ellipsis. */
export function truncate(str: string, len: number): string {
  return str.length > len ? `${str.slice(0, len - 1)}…` : str;
}

/** Deterministic avatar URL from a name/email. */
export function avatarUrl(name: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

/** Round to 2 decimals. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Resolves relative media URLs (like /uploads/...) to point to the backend server. */
export function resolveMediaUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
  const base = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}