import { describe, expect, it } from 'vitest';
import { inTurn, sidesOf } from './rounds';

describe('sidesOf', () => {
  it('goes round a closed outline, the last side back to the first point', () => {
    expect(sidesOf(['a', 'b', 'c'])).toEqual([
      { p: 'a', q: 'b', n: 0 },
      { p: 'b', q: 'c', n: 1 },
      { p: 'c', q: 'a', n: 2 },
    ]);
    expect(sidesOf([])).toEqual([]);
  });
});

describe('inTurn', () => {
  it('takes a list round and round, and the first for a count that is not one', () => {
    expect([0, 1, 2, 3, 4].map((n) => inTurn(['x', 'y', 'z'], n))).toEqual([
      'x',
      'y',
      'z',
      'x',
      'y',
    ]);
    expect(inTurn(['x', 'y'], Number.NaN)).toBe('x');
  });
});
