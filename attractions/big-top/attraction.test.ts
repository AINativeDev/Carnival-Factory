import { describe, expect, it } from 'vitest';
import { elfPeek, PEEK } from './attraction';

describe('elfPeek', () => {
  it('pops an elf all the way out a quarter of the way through its peek', () => {
    expect(elfPeek(0, PEEK / 4)).toBeCloseTo(1);
  });

  it('keeps the elf hidden for the second half of its peek', () => {
    expect(elfPeek(0, (PEEK * 3) / 4)).toBe(0);
  });

  it('stays between hidden and all the way out', () => {
    for (let time = 0; time < 2 * PEEK; time += 100) {
      for (const flap of [0, 1, 2]) {
        expect(elfPeek(flap, time)).toBeGreaterThanOrEqual(0);
        expect(elfPeek(flap, time)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('takes turns: the next flap peeks a third of a peek later', () => {
    const later = PEEK / 4 + PEEK / 3;
    expect(elfPeek(1, later)).toBeCloseTo(1);
    expect(elfPeek(2, later + PEEK / 3)).toBeCloseTo(1);
  });
});
