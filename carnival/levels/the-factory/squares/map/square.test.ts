import { describe, expect, it } from 'vitest';
import { DEPLOY, riseAt } from './square';

describe('riseAt', () => {
  it('springs the new booth up after each deploy, and holds it built', () => {
    expect(riseAt(0)).toBe(0);
    expect(riseAt(DEPLOY / 6)).toBeCloseTo(0.5);
    expect(riseAt(DEPLOY / 2)).toBe(1);
    expect(riseAt(DEPLOY)).toBeCloseTo(0);
  });
});
