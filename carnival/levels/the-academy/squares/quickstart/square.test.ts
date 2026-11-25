import { describe, expect, it } from 'vitest';
import { DASH, dashAt, handAt } from './square';

describe('dashAt', () => {
  it('waits on the starting line, dashes over the finish, then starts again', () => {
    expect(dashAt(0)).toBe(0);
    expect(dashAt(DASH * 0.2)).toBe(0);
    expect(dashAt(DASH * 0.55)).toBeCloseTo(0.5);
    expect(dashAt(DASH * 0.9)).toBe(1);
    expect(dashAt(DASH)).toBe(0);
  });
});

describe('handAt', () => {
  it('goes once round the stopwatch each dash', () => {
    expect(handAt(0)).toBe(0);
    expect(handAt(DASH / 2)).toBeCloseTo(Math.PI);
  });
});
