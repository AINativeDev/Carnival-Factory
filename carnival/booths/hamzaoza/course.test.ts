import { describe, expect, it } from 'vitest';
import { EDGE, pathAt, thingAt, thingsBetween } from './course';
import { BASE, distanceFor, speedFor, TOP } from './sledding';

describe('the course', () => {
  it('is the same every time for the same seed, and differs between seeds', () => {
    expect(thingAt(3, 7)).toEqual(thingAt(3, 7));
    const a = Array.from({ length: 20 }, (_, i) => thingAt(1, i).lane);
    const b = Array.from({ length: 20 }, (_, i) => thingAt(2, i).lane);
    expect(a).not.toEqual(b);
  });

  it('keeps every rock and drift clear of the line and on the track', () => {
    for (let seed = 1; seed < 6; seed++) {
      for (let i = 0; i < 200; i++) {
        const t = thingAt(seed, i);
        expect(Math.abs(t.lane)).toBeLessThanOrEqual(EDGE);
        if (t.kind !== 'flake') {
          expect(Math.abs(t.lane - pathAt(seed, t.distance))).toBeGreaterThanOrEqual(0.7);
        }
      }
    }
  });

  it('finds each thing in a stretch once, nearest first', () => {
    const stretch = thingsBetween(1, 30, 120);
    expect(stretch.length).toBeGreaterThan(0);
    for (const t of stretch) expect(t.distance > 30 && t.distance <= 120).toBe(true);
    const distances = stretch.map((t) => t.distance);
    expect(new Set(distances).size).toBe(distances.length);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });
});

describe('speed', () => {
  it('starts gently, speeds up slowly and tops out', () => {
    expect(speedFor(0)).toBe(BASE);
    expect(speedFor(10)).toBeGreaterThan(speedFor(5));
    expect(speedFor(1_000)).toBe(TOP);
    expect(distanceFor(0)).toBe(0);
    let last = 0;
    for (let s = 1; s < 120; s++) {
      const d = distanceFor(s);
      expect(d - last).toBeLessThanOrEqual(TOP + 1e-9);
      expect(d).toBeGreaterThan(last);
      last = d;
    }
  });
});
