import { describe, expect, it } from 'vitest';
import { builtParts, ease, LOOP, momentAt, spinAngle, spinSpeed, SPIN_TIME, wobble } from './booth';

describe('momentAt', () => {
  it('builds, carries, spins and rests, in that order', () => {
    const stages = [0, 2_000, 3_500, 5_000, 8_000, 11_500].map((t) => momentAt(t).stage);
    expect(stages).toEqual(['body', 'stripe', 'handle', 'carry', 'spin', 'rest']);
  });

  it('repeats every loop, before the page loaded too', () => {
    for (const time of [0, 1_234, 6_000, 11_999]) {
      expect(momentAt(time + 5 * LOOP)).toEqual(momentAt(time));
    }
    expect(momentAt(-500)).toEqual(momentAt(LOOP - 500));
  });

  it('keeps progress between 0 and 1', () => {
    for (let t = 0; t < LOOP; t += 37) {
      const { progress } = momentAt(t);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThan(1);
    }
  });
});

describe('builtParts', () => {
  it('goes from nothing to a whole top and stays whole', () => {
    expect(builtParts(momentAt(0))).toBe(0);
    expect(builtParts(momentAt(2_250))).toBeCloseTo(1.5);
    expect(builtParts(momentAt(4_000))).toBeGreaterThan(2);
    expect(builtParts(momentAt(8_000))).toBe(3);
  });
});

describe('the spin', () => {
  it('slows to a stop, and never turns backwards', () => {
    expect(spinSpeed(0)).toBe(1);
    expect(spinSpeed(SPIN_TIME)).toBe(0);
    let last = 0;
    for (let ms = 0; ms <= SPIN_TIME; ms += 50) {
      expect(spinAngle(ms)).toBeGreaterThanOrEqual(last);
      last = spinAngle(ms);
    }
    expect(spinAngle(SPIN_TIME * 2)).toBe(spinAngle(SPIN_TIME));
  });

  it('wobbles more as it slows, and not at all at the start', () => {
    expect(wobble(0)).toBe(0);
    const early = Math.max(...Array.from({ length: 60 }, (_, i) => Math.abs(wobble(i * 20))));
    const late = Math.max(
      ...Array.from({ length: 60 }, (_, i) => Math.abs(wobble(SPIN_TIME - 1_200 + i * 20))),
    );
    expect(late).toBeGreaterThan(early);
  });
});

describe('ease', () => {
  it('is slow at both ends and clamped', () => {
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
    expect(ease(0.5)).toBe(0.5);
  });
});
