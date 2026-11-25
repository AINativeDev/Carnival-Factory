import { describe, expect, it } from 'vitest';
import { bookOut, LOOKUP, SHELVES, SPINES } from './square';

describe('bookOut', () => {
  it('pulls out each book in turn, up the shelves, then starts again', () => {
    expect(bookOut(0)).toBe(0);
    expect(bookOut(LOOKUP * 1.5)).toBe(1);
    expect(bookOut(LOOKUP * SPINES.length * SHELVES)).toBe(0);
    expect(bookOut(-LOOKUP)).toBe(SPINES.length * SHELVES - 1);
  });
});
