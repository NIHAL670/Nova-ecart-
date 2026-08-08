import { describe, expect, it } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases and replaces spaces', () => {
    expect(slugify('Wireless Headphones Pro')).toBe('wireless-headphones-pro');
  });

  it('strips apostrophes and special chars', () => {
    expect(slugify("Men's Jacket!")).toBe('mens-jacket');
  });

  it('collapses multiple separators', () => {
    expect(slugify('A---B   C')).toBe('a-b-c');
  });

  it('trims leading/trailing dashes', () => {
    expect(slugify('--hello--')).toBe('hello');
  });

  it('handles empty input', () => {
    expect(slugify('')).toBe('');
  });
});