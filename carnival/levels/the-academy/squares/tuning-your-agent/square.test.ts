import { describe, expect, it } from 'vitest';
import { NEEDLE, needleAt, TUNE } from './square';

describe('needleAt', () => {
  it('starts low, climbs as the dials turn, and rests in the green', () => {
    expect(needleAt(0)).toBeCloseTo(NEEDLE.low);
    expect(needleAt(TUNE * 0.8)).toBeCloseTo(NEEDLE.high);
    expect(needleAt(TUNE * 0.35)).toBeGreaterThan(NEEDLE.low);
    expect(needleAt(TUNE * 0.35)).toBeLessThan(NEEDLE.high);
  });
});
