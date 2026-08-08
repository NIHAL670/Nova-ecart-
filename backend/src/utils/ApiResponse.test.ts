import { describe, expect, it } from 'vitest';
import { ApiResponse, ok, noContent } from './ApiResponse';

describe('ApiResponse', () => {
  it('builds a success envelope', () => {
    const res = ok({ id: 1 }, 'Created', { page: 1 });
    expect(res.success).toBe(true);
    expect(res.message).toBe('Created');
    expect(res.data).toEqual({ id: 1 });
    expect(res.meta?.page).toBe(1);
  });

  it('defaults message to Success', () => {
    expect(ok([]).message).toBe('Success');
  });

  it('noContent has null data', () => {
    const res = noContent();
    expect(res.success).toBe(true);
    expect(res.data).toBeNull();
  });

  it('is an ApiResponse instance', () => {
    expect(ok(1)).toBeInstanceOf(ApiResponse);
  });
});