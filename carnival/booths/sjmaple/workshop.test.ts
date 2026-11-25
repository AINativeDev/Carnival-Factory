import { describe, expect, it } from 'vitest';
import { HANDLES, STRIPES } from './parts';
import { CARRY, REST, testOf } from './test-mat';
import {
  DEMO_LAUNCH,
  DEMO_LOOP,
  demoAt,
  IDLE,
  idle,
  newWorkshop,
  press,
  settle,
  testing,
} from './workshop';

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

  it('reports the top that was tested, whatever is built after it', () => {
    let state = press(newWorkshop(), 'spin', 1, 0);
    const { spin } = testOf(state.tested, 0);
    const after = CARRY + spin + REST;
    // A round body, then a wide one, which would spin longer.
    state = press(state, 'body', 1, after);
    expect(state.build.body).toBe(1);
    expect(state.tested.body).toBe(0);
    expect(testing(state, after + 1)).toBe(false);
    expect(settle(state, after + 1).best).toBe(spin);
  });

  it('counts a finished test before a new spin replaces it', () => {
    const launched = press(newWorkshop(), 'spin', 1, 0);
    const { spin } = testOf(launched.build, 0);
    const after = CARRY + spin + REST;
    const again = press(launched, 'spin', 1, after);
    expect(again.launchedAt).toBe(after);
    expect(again.best).toBe(spin);
  });

  it('keeps the longest spin', () => {
    const state = { ...press(newWorkshop(), 'spin', 1, 0), best: 99_000 };
    expect(settle(state, 60_000).best).toBe(99_000);
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
