import { describe, expect, it } from 'vitest';
import { LOOP, SLOT } from './letters';
import { FLICK, flickOf } from './cat';

describe('flickOf', () => {
  const landing = 800;

  it('sleeps until a letter lands on the pile', () => {
    expect(flickOf(landing - 1)).toBe(0);
    expect(flickOf(landing + FLICK)).toBe(0);
  });

  it('flicks while the letter settles, and peaks in the middle', () => {
    expect(flickOf(landing)).toBe(0);
    expect(flickOf(landing + FLICK / 4)).toBeGreaterThan(0.7);
    expect(flickOf(landing + FLICK / 2)).toBeLessThan(0.1);
  });

  it('flicks for every letter, in every round', () => {
    for (let slot = 0; slot < 4; slot++) {
      for (const round of [0, 1, 5]) {
        const at = round * LOOP + slot * SLOT + landing + FLICK / 4;
        expect(flickOf(at)).toBeGreaterThan(0.7);
      }
    }
  });

  it('keeps time before the page loaded', () => {
    expect(flickOf(-LOOP + landing + FLICK / 4)).toBeGreaterThan(0.7);
  });
});
