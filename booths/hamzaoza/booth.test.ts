import { describe, expect, it } from 'vitest';
import {
  BEST,
  COURSE,
  distanceAt,
  inView,
  LOOP,
  pathAt,
  scaleAt,
  scoreAt,
  THING_LIST,
  TRACK,
  VIEW,
} from './booth';

describe('the run', () => {
  it('loops cleanly: the end of the course meets the start', () => {
    expect(distanceAt(0)).toBe(0);
    expect(distanceAt(LOOP)).toBe(0);
    expect(pathAt(0)).toBeCloseTo(pathAt(COURSE));
  });

  it('keeps every rock and drift clear of the penguin and every snowflake on its path', () => {
    for (const t of THING_LIST) {
      const gap = Math.abs(t.lane - pathAt(t.distance));
      if (t.kind === 'flake') expect(gap).toBe(0);
      else expect(gap).toBeGreaterThanOrEqual(0.7);
      expect(Math.abs(t.lane)).toBeLessThan(TRACK);
    }
  });

  it('counts the score up through the run, never down, and starts again', () => {
    let last = 0;
    for (let t = 0; t < LOOP; t += 250) {
      const score = scoreAt(t);
      expect(score).toBeGreaterThanOrEqual(last);
      last = score;
    }
    expect(last).toBeLessThanOrEqual(BEST);
    expect(scoreAt(LOOP)).toBe(0);
  });
});

describe('the view', () => {
  it('shrinks things towards the horizon', () => {
    expect(scaleAt(0)).toBe(1);
    expect(scaleAt(50)).toBeLessThan(scaleAt(10));
  });

  it('lists what is ahead, furthest first', () => {
    const seen = inView(5_000);
    expect(seen.length).toBeGreaterThan(0);
    for (let i = 1; i < seen.length; i++)
      expect(seen[i - 1].ahead).toBeGreaterThanOrEqual(seen[i].ahead);
    for (const { ahead } of seen) expect(ahead).toBeLessThan(VIEW);
  });
});
