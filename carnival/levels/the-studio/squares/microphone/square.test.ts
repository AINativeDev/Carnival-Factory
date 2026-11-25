import { describe, expect, it } from 'vitest';
import { BARS, barHeight } from './square';

describe('barHeight', () => {
  it('stays between a whisper and full height', () => {
    for (let time = 0; time < 6_000; time += 137)
      for (let n = 0; n < BARS; n++) {
        expect(barHeight(time, n)).toBeGreaterThanOrEqual(0.15);
        expect(barHeight(time, n)).toBeLessThanOrEqual(1);
      }
  });

  it('lets one voice speak at a time: the quiet half stays low', () => {
    // At this time the first voice speaks, so the right half is quiet.
    const time = 1_500 * (Math.PI / 2);
    for (let n = Math.ceil(BARS / 2); n < BARS; n++)
      expect(barHeight(time, n)).toBeLessThanOrEqual(0.25);
    const later = 1_500 * (Math.PI * 1.5);
    for (let n = 0; n < BARS / 2; n++) expect(barHeight(later, n)).toBeLessThanOrEqual(0.25);
  });
});
