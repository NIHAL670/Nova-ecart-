import { describe, expect, it, vi } from 'vitest';
import { ApiFeatures } from './ApiFeatures';

/** Minimal chainable query stub so we can assert the built options. */
function stubQuery() {
  const q: Record<string, any> = {};
  for (const m of ['find', 'sort', 'skip', 'limit', 'select']) {
    q[m] = vi.fn(() => q);
  }
  q.exec = vi.fn(async () => []);
  q.getFilter = vi.fn(() => ({}));
  return q;
}

const stubModel = { find: () => stubQuery() } as never;

describe('ApiFeatures', () => {
  it('parses pagination + computes skip', () => {
    const f = new ApiFeatures(stubModel, { page: '3', limit: '20', sort: '-price' }, ['name']);
    expect(f.build()).toMatchObject({ page: 3, limit: 20, skip: 40, sort: '-price' });
  });

  it('clamps limit to max 100', () => {
    const f = new ApiFeatures(stubModel, { limit: '999' }, []);
    expect(f.build().limit).toBe(100);
  });

  it('strips utility keys from the filter', () => {
    const f = new ApiFeatures(stubModel, { page: '1', search: 'x', category: 'abc', priceMin: '10', sort: 'x' }, []);
    expect(f.build().filter).toEqual({ category: 'abc' });
  });

  it('escapes regex in search', () => {
    const f = new ApiFeatures(stubModel, { search: 'a.b*' }, ['name']);
    f.search();
    expect(f.build().search).toBe('a.b*');
  });

  it('keeps empty search as empty string', () => {
    const f = new ApiFeatures(stubModel, {}, ['name']);
    f.search();
    expect(f.build().search).toBe('');
  });

  it('exposes getFilter returning query conditions', () => {
    const f = new ApiFeatures(stubModel, {}, []);
    expect(f.getFilter()).toEqual({});
  });
});