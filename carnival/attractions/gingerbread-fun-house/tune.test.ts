import { describe, expect, it } from 'vitest';
import { hash, notesIn, pick, stepOf, swell } from './tune';

describe('the tune', () => {
  it('knows four notes, then five from round 5 and six from round 8', () => {
    expect([1, 4, 5, 7, 8, 30].map(notesIn)).toEqual([4, 4, 5, 5, 6, 6]);
  });

  it('plays quicker each round, down to a floor', () => {
    expect(stepOf(2)).toBeLessThan(stepOf(1));
    expect(stepOf(100)).toBe(380);
  });

  it('picks steadily, always within range', () => {
    expect(hash(3, 4)).toBe(hash(3, 4));
    for (let n = 0; n < 200; n++) {
      const note = pick(7, n, 5);
      expect(note).toBeGreaterThanOrEqual(0);
      expect(note).toBeLessThan(5);
    }
  });

  it('swells a note in and fades it out, dark outside its light', () => {
    expect(swell(-0.1)).toBe(0);
    expect(swell(1.1)).toBe(0);
    expect(swell(0.2)).toBeCloseTo(1);
    expect(swell(0.1)).toBeGreaterThan(0);
    expect(swell(0.6)).toBeLessThan(swell(0.3));
  });
});
