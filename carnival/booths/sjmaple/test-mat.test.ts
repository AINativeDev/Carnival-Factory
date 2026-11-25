import { describe, expect, it } from 'vitest';
import { PLACES } from './board';
import { BODIES, HANDLES } from './parts';
import {
  CARRY,
  carryTip,
  ease,
  rating,
  REST,
  restPose,
  spinAngle,
  spinSpeed,
  stageAt,
  testOf,
  wobble,
} from './test-mat';

describe('testOf', () => {
  it('lets the parts decide how long it spins and how it wobbles', () => {
    const wide = testOf({ body: 1, stripe: 0, handle: 1 }, 0);
    const tall = testOf({ body: 2, stripe: 0, handle: 2 }, 0);
    expect(wide.spin).toBeGreaterThan(tall.spin);
    expect(rating(wide.wobble)).toBe('STEADY');
    expect(rating(tall.wobble)).toBe('WILD');
    expect(rating(testOf({ body: 0, stripe: 0, handle: 0 }, 0).wobble)).toBe('WOBBLY');
  });

  it('varies by no more than a tenth with the moment it is let go', () => {
    for (const [b, body] of BODIES.entries()) {
      for (const [h, handle] of HANDLES.entries()) {
        const base = body.spin + handle.spin;
        for (const at of [0, 123, 4_567, 89_012]) {
          const { spin } = testOf({ body: b, stripe: 0, handle: h }, at);
          expect(spin).toBeGreaterThanOrEqual(base * 0.9 - 1);
          expect(spin).toBeLessThanOrEqual(base * 1.1 + 1);
        }
      }
    }
  });

  it('ignores the stripes', () => {
    expect(testOf({ body: 0, stripe: 3, handle: 0 }, 5)).toEqual(
      testOf({ body: 0, stripe: 0, handle: 0 }, 5),
    );
  });
});

describe('stageAt', () => {
  it('carries, spins, rests and is done, in that order', () => {
    const spin = 5_000;
    const stages = [0, CARRY + 10, CARRY + spin + 10, CARRY + spin + REST].map(
      (ms) => stageAt(ms, spin).stage,
    );
    expect(stages).toEqual(['carry', 'spin', 'rest', 'done']);
  });
});

describe('the spin', () => {
  const test = { spin: 5_500, wobble: 1 };

  it('slows to a stop, and never turns backwards', () => {
    expect(spinSpeed(0, test.spin)).toBe(1);
    expect(spinSpeed(test.spin, test.spin)).toBe(0);
    let last = 0;
    for (let ms = 0; ms <= test.spin; ms += 50) {
      expect(spinAngle(ms, test.spin)).toBeGreaterThanOrEqual(last);
      last = spinAngle(ms, test.spin);
    }
    expect(spinAngle(test.spin * 2, test.spin)).toBe(spinAngle(test.spin, test.spin));
  });

  it('wobbles more as it slows, and more for a wobblier top', () => {
    expect(wobble(0, test)).toBe(0);
    const most = (t: { spin: number; wobble: number }, from: number) =>
      Math.max(...Array.from({ length: 60 }, (_, i) => Math.abs(wobble(from + i * 20, t))));
    expect(most(test, test.spin - 1_200)).toBeGreaterThan(most(test, 0));
    expect(most({ ...test, wobble: 1.5 }, test.spin - 1_200)).toBeGreaterThan(
      most(test, test.spin - 1_200),
    );
  });
});

describe('ease', () => {
  it('is slow at both ends and clamped', () => {
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
    expect(ease(0.5)).toBe(0.5);
  });
});

describe('carryTip', () => {
  const from = { x: PLACES.bench.x - 2, y: PLACES.bench.y };
  const to = PLACES.mat;

  it('starts at the bench and ends on the mat', () => {
    expect(carryTip(0, from, to)).toEqual(from);
    expect(carryTip(1, from, to)).toEqual({ x: to.x, y: to.y });
  });

  it('hops above both ends on the way', () => {
    expect(carryTip(0.5, from, to).y).toBeLessThan(Math.min(from.y, to.y));
  });
});

describe('restPose', () => {
  it('leans further at first, then lies on its side', () => {
    expect(restPose(0)).toEqual({ lying: false, lean: 2 });
    expect(restPose(0.1).lean).toBeGreaterThan(2);
    for (const p of [0.25, 0.5, 0.99]) expect(restPose(p).lying).toBe(true);
  });
});
