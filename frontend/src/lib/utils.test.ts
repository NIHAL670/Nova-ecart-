import { describe, expect, it } from 'vitest';
import { cn, formatCurrency, formatCompact, round2, truncate, timeAgo } from './utils';

describe('cn', () => {
  it('merges conflicting Tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', null, undefined, false, 'font-bold')).toBe('text-sm font-bold');
  });
});

describe('formatCurrency', () => {
  it('formats USD with 2 decimals', () => {
    expect(formatCurrency(199.5)).toBe('$199.50');
  });
  it('formats INR with en-IN grouping', () => {
    expect(formatCurrency(150000, 'INR')).toContain('₹');
  });
});

describe('formatCompact', () => {
  it('compacts thousands and millions', () => {
    expect(formatCompact(1250)).toBe('1.3k');
    expect(formatCompact(2_500_000)).toBe('2.5M');
    expect(formatCompact(42)).toBe('42');
  });
});

describe('round2', () => {
  it('rounds to 2 decimals', () => {
    expect(round2(10.005)).toBe(10.01);
    expect(round2(10)).toBe(10);
  });
});

describe('truncate', () => {
  it('adds ellipsis past the limit', () => {
    expect(truncate('hello world', 5)).toBe('hell…');
    expect(truncate('short', 10)).toBe('short');
  });
});

describe('timeAgo', () => {
  it('returns sensible units', () => {
    // Small buffer (-5s) so the elapsed seconds stay inside the expected bucket.
    expect(timeAgo(Date.now() - 5 * 60 * 1000 - 5000)).toBe('5 minutes ago');
    expect(timeAgo(Date.now() - 2 * 60 * 60 * 1000 - 5000)).toBe('2 hours ago');
    expect(timeAgo(Date.now() - 3 * 24 * 60 * 60 * 1000 - 5000)).toBe('3 days ago');
  });
});