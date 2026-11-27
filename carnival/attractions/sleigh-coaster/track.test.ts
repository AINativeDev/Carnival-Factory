import { describe, expect, it } from 'vitest';
import { G, hillAt, HILLS, heightAt, makeHills, nextHill, trackAt } from './track';

const first = HILLS.at(0);
const last = HILLS.at(-1);

describe('the course', () => {
  it('runs hill after hill with no gaps, each crest in its middle', () => {
    HILLS.slice(1).forEach((hill, n) => {
      const before = HILLS.at(n);
      expect(hill.start).toBeCloseTo((before?.start ?? 0) + (before?.length ?? 0));
      expect(hill.crest).toBeCloseTo(hill.start + hill.length / 2);
    });
    expect(makeHills(5)).toEqual(HILLS.slice(0, 5));
  });

  it('puts a bump between hills now and then, never two together, and a bump throws nobody off', () => {
    const bumps = HILLS.filter((hill) => hill.bump);
    expect(bumps.length).toBeGreaterThan(10);
    HILLS.slice(1).forEach((hill, n) => {
      expect(hill.bump && HILLS.at(n)?.bump).toBeFalsy();
    });
    for (const bump of bumps) expect(bump.crash).toBe(Infinity);
    expect(HILLS.slice(0, 3).some((hill) => hill.bump)).toBe(false);
  });

  it('gets steeper, taller and bumpier as it goes, with less room between lifting off and flying off', () => {
    const hills = HILLS.filter((hill) => !hill.bump);
    const early = hills.slice(0, 5);
    const late = hills.slice(-10);
    const mean = (list: typeof hills, of: (hill: (typeof hills)[0]) => number) =>
      list.reduce((sum, hill) => sum + of(hill), 0) / list.length;
    expect(mean(late, (h) => h.height)).toBeGreaterThan(mean(early, (h) => h.height) + 8);
    expect(mean(late, (h) => h.height / h.length)).toBeGreaterThan(
      mean(early, (h) => h.height / h.length) * 1.5,
    );
    expect(mean(late, (h) => h.crash / h.lift)).toBeLessThan(mean(early, (h) => h.crash / h.lift));
    const bumpsIn = (from: number, to: number) =>
      HILLS.slice(from, to).filter((h) => h.bump).length;
    expect(bumpsIn(30, 45)).toBeGreaterThan(bumpsIn(0, 15));
  });

  it('lifts off a crest exactly where gravity can no longer hold the sleigh to the rail', () => {
    for (const hill of HILLS) {
      const { bend } = trackAt(hill.crest);
      expect(hill.lift ** 2 * -bend).toBeCloseTo(G);
    }
  });
});

describe('the track', () => {
  it('is flat out of the station and past the end of the course', () => {
    expect(trackAt(-5)).toEqual({ height: 0, slope: 0, bend: 0 });
    expect(hillAt(5)).toBeUndefined();
    expect(hillAt((last?.start ?? 0) + (last?.length ?? 0) + 1)).toBeUndefined();
    expect(heightAt(1e9)).toBe(0);
  });

  it('rises to each hill’s crest and falls again, bending over the top', () => {
    if (!first) throw new Error('no hills');
    expect(hillAt(first.start + 1)).toBe(first);
    expect(heightAt(first.start)).toBeCloseTo(0);
    expect(heightAt(first.crest)).toBeCloseTo(first.height);
    expect(trackAt(first.start + first.length / 4).slope).toBeGreaterThan(0);
    expect(trackAt(first.start + (first.length * 3) / 4).slope).toBeLessThan(0);
    expect(trackAt(first.crest).bend).toBeLessThan(0);
    expect(trackAt(first.start + 0.1).bend).toBeGreaterThan(0);
  });

  it('finds the next real hill ahead, past any bump', () => {
    expect(nextHill(0)).toBe(first);
    const bump = HILLS.find((hill) => hill.bump);
    expect(nextHill(bump?.start ?? 0)?.bump).toBe(false);
    expect(nextHill(1e9)).toBeUndefined();
  });
});
