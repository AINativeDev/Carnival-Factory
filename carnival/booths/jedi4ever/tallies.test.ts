import { describe, expect, it } from 'vitest';
import { LOOP, SLOT } from './letters';
import { BOUNCE, bounceOf, lampAt, TALLY, TOYS_AT_DAWN, toysMade } from './tallies';

describe('lampAt', () => {
  it('turns green once a toy passes its check, and back to amber after', () => {
    expect(lampAt(6_000)).toBe(0);
    expect(lampAt(7_300)).toBe(1);
    expect(lampAt(8_400)).toBe(0);
    expect(lampAt(7_300 + LOOP)).toBe(1);
  });

  it('stays amber while the letter for later would be checked', () => {
    expect(lampAt(2 * SLOT + 7_300)).toBe(0);
  });
});

describe('the toy counter sign', () => {
  it('ticks up by one every 3 seconds', () => {
    expect(toysMade(0)).toBe(TOYS_AT_DAWN);
    expect(toysMade(TALLY - 1)).toBe(TOYS_AT_DAWN);
    expect(toysMade(TALLY)).toBe(TOYS_AT_DAWN + 1);
    expect(toysMade(10 * TALLY)).toBe(TOYS_AT_DAWN + 10);
  });

  it('bounces after a tick and then rests', () => {
    expect(bounceOf(0)).toBe(0);
    expect(bounceOf(BOUNCE / 4)).toBeGreaterThan(0.5);
    expect(bounceOf(BOUNCE)).toBe(0);
    expect(bounceOf(TALLY - 1)).toBe(0);
  });
});
