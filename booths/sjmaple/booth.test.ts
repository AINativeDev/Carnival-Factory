import { describe, expect, it } from 'vitest';
import {
  BODIES,
  BUTTONS,
  buttonAt,
  CARRY,
  carryTip,
  DEMO_LAUNCH,
  DEMO_LOOP,
  demoAt,
  ease,
  HANDLES,
  IDLE,
  idle,
  newWorkshop,
  PLACES,
  press,
  rating,
  REST,
  restPose,
  settle,
  spinAngle,
  spinSpeed,
  stageAt,
  STRIPES,
  testing,
  testOf,
  wobble,
} from './booth';

describe('buttonAt', () => {
  it('finds each button from a point inside it, and nothing outside them', () => {
    for (const b of BUTTONS) {
      expect(buttonAt(b.x + b.w / 2, b.y + b.h / 2)).toBe(b.name);
    }
    expect(buttonAt(PLACES.mat.x, PLACES.mat.y)).toBeNull();
    expect(buttonAt(-1, -1)).toBeNull();
  });
});

describe('press', () => {
  it('cycles each part through its choices, one per press', () => {
    let state = newWorkshop();
    state = press(state, 'body', 1, 100);
    expect(state.build.body).toBe(1);
    state = press(state, 'stripe', STRIPES.length + 2, 200);
    expect(state.build.stripe).toBe(2);
    state = press(state, 'handle', HANDLES.length, 300);
    expect(state.build.handle).toBe(0);
    expect(state.changedAt).toBe(300);
  });

  it('does nothing without a press', () => {
    const state = newWorkshop();
    expect(press(state, 'body', 0, 100)).toBe(state);
  });

  it('sets the top spinning, and ignores every button until the test is done', () => {
    let state = press(newWorkshop(), 'spin', 1, 1_000);
    expect(state.launchedAt).toBe(1_000);
    expect(testing(state, 1_500)).toBe(true);
    const during = press(state, 'body', 1, 2_000);
    expect(during.build).toEqual(state.build);
    expect(press(during, 'spin', 1, 2_100).launchedAt).toBe(1_000);
    const { spin } = testOf(state.build, 1_000);
    const after = 1_000 + CARRY + spin + REST;
    expect(testing(state, after)).toBe(false);
    state = press(state, 'body', 1, after);
    expect(state.build.body).toBe(1);
  });
});

describe('settle', () => {
  it('counts a finished test towards the best, once', () => {
    const launched = press(newWorkshop(), 'spin', 1, 0);
    const { spin } = testOf(launched.build, 0);
    expect(settle(launched, 1_000).best).toBe(0);
    const done = settle(launched, CARRY + spin + REST);
    expect(done.best).toBe(spin);
    expect(done.counted).toBe(true);
  });

  it('keeps the longest spin', () => {
    const state = { ...press(newWorkshop(), 'spin', 1, 0), best: 99_000 };
    expect(settle(state, 60_000).best).toBe(99_000);
  });
});

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
    for (let b = 0; b < BODIES.length; b++) {
      for (let h = 0; h < HANDLES.length; h++) {
        const base = BODIES[b].spin + HANDLES[h].spin;
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

describe('the elf on their own', () => {
  it('takes over when nobody has pressed for a while and no top is out', () => {
    const state = newWorkshop();
    expect(idle(state, 0)).toBe(true);
    const pressed = press(state, 'body', 1, 1_000);
    expect(idle(pressed, 1_000 + IDLE - 1)).toBe(false);
    expect(idle(pressed, 1_000 + IDLE + 1)).toBe(true);
  });

  it('builds a top, then lets it go, and finishes testing it before the next round', () => {
    const round = demoAt(DEMO_LOOP * 4 + 100);
    expect(round.launchedAt).toBe(DEMO_LOOP * 4 + DEMO_LAUNCH);
    expect(round.built).toBeLessThan(3);
    expect(demoAt(DEMO_LOOP * 4 + DEMO_LAUNCH).built).toBe(3);
    for (let n = 0; n < 12; n++) {
      const { build, launchedAt } = demoAt(n * DEMO_LOOP);
      const { spin } = testOf(build, launchedAt);
      expect(launchedAt + CARRY + spin + REST).toBeLessThan((n + 1) * DEMO_LOOP);
    }
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
