import { describe, expect, it } from 'vitest';
import { flashesPerSecond, type Sample } from './flashing';

/** One region's luminance over time, sampled at 60 frames a second for two seconds. */
const frames = (at: (time: number) => number): Sample[] =>
  Array.from({ length: 120 }, (_, n) => ({ time: n * 16.7, regions: [at(n * 16.7)] }));

describe('flashesPerSecond', () => {
  it('counts a square that blinks dark and light five times a second', () => {
    expect(flashesPerSecond(frames((t) => (Math.floor(t / 100) % 2 ? 0.6 : 0.1)))).toBe(5);
  });

  it('passes a gentle glow that swings slowly', () => {
    expect(flashesPerSecond(frames((t) => 0.3 + 0.1 * Math.sin(t / 900)))).toBeLessThanOrEqual(1);
  });

  it('counts a square that fades dark and light five times a second', () => {
    expect(flashesPerSecond(frames((t) => 0.35 + 0.25 * Math.sin((t / 200) * Math.PI * 2)))).toBe(
      5,
    );
  });

  it('passes small flickers below the threshold', () => {
    expect(flashesPerSecond(frames((t) => (Math.floor(t / 50) % 2 ? 0.34 : 0.3)))).toBe(0);
  });

  it('passes changes between bright colours', () => {
    expect(flashesPerSecond(frames((t) => (Math.floor(t / 100) % 2 ? 0.95 : 0.82)))).toBe(0);
  });

  it('counts a flash in any one region', () => {
    const samples = frames(() => 0.3).map((s) => ({
      ...s,
      regions: [0.3, Math.floor(s.time / 100) % 2 ? 0.6 : 0.1],
    }));
    expect(flashesPerSecond(samples)).toBe(5);
  });
});
