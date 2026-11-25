import type { Button } from './board';
import { BODIES, type Build, HANDLES, STRIPES } from './parts';
import { clamp01, stageAt, testOf } from './test-mat';

/** After this long with nobody pressing, in milliseconds, the elf builds and tests tops on their own again. */
export const IDLE = 30_000;
/** One round of the elf's own building and testing. */
export const DEMO_LOOP = 16_000;
/** When in their round the elf sets the top spinning, so it is done before the next round starts. */
export const DEMO_LAUNCH = 3_000;
/** The elf keeps hammering this long after a part is changed. */
export const HAMMER = 600;

/** The elf's hammering arm, 0 (up) to 1 (down), while a part is being made. */
export function hammer(time: number): number {
  return (Math.sin(time / 110) + 1) / 2;
}

/** All the booth remembers of the people playing with it, for one visit. */
export interface Workshop {
  build: Build;
  /** The `time` the top was last let go, or null before the first test. */
  launchedAt: number | null;
  /** The top that was let go then, which later changes to `build` never touch. */
  tested: Build;
  /** The longest spin so far, in milliseconds, counted once each test is done. */
  best: number;
  /** Whether the last test has been counted towards `best`. */
  counted: boolean;
  /** The `time` of the last press, and of the last change to a part. */
  pressedAt: number;
  changedAt: number;
}

/** The workshop a visit starts with: the first of every part, nothing tested, and the elf free to play. */
export function newWorkshop(): Workshop {
  return {
    build: { body: 0, stripe: 0, handle: 0 },
    launchedAt: null,
    tested: { body: 0, stripe: 0, handle: 0 },
    best: 0,
    counted: true,
    pressedAt: -Infinity,
    changedAt: -Infinity,
  };
}

/** Whether a top is out on the mat at `time`, so the buttons wait. */
export function testing(state: Workshop, time: number): boolean {
  if (state.launchedAt === null) return false;
  const test = testOf(state.tested, state.launchedAt);
  return stageAt(time - state.launchedAt, test.spin).stage !== 'done';
}

/**
 * The workshop after `presses` presses on `button` at `time`. Buttons do
 * nothing while a top is out, and a finished test is counted before anything
 * replaces it.
 */
export function press(state: Workshop, button: Button | null, presses: number, time: number) {
  if (presses < 1) return state;
  const pressed = { ...settle(state, time), pressedAt: time };
  if (!button || testing(state, time)) return pressed;
  if (button === 'spin')
    return { ...pressed, launchedAt: time, tested: state.build, counted: false };
  const { body, stripe, handle } = state.build;
  const build =
    button === 'body'
      ? { body: (body + presses) % BODIES.length, stripe, handle }
      : button === 'stripe'
        ? { body, stripe: (stripe + presses) % STRIPES.length, handle }
        : { body, stripe, handle: (handle + presses) % HANDLES.length };
  return { ...pressed, build, changedAt: time };
}

/** The workshop with its last test counted towards the best once it is done. */
export function settle(state: Workshop, time: number): Workshop {
  if (state.counted || state.launchedAt === null || testing(state, time)) return state;
  const { spin } = testOf(state.tested, state.launchedAt);
  return { ...state, best: Math.max(state.best, spin), counted: true };
}

/** Whether nobody has played for a while, so the elf runs the workshop on their own. */
export function idle(state: Workshop, time: number): boolean {
  return time - state.pressedAt > IDLE && !testing(state, time);
}

/** The elf's own round at `time`: which top they build, when they let it go, and how far it is built. */
export function demoAt(time: number): { build: Build; launchedAt: number; built: number } {
  const n = Math.floor(time / DEMO_LOOP);
  const start = n * DEMO_LOOP;
  return {
    build: {
      body: n % BODIES.length,
      stripe: n % STRIPES.length,
      handle: (n + 1) % HANDLES.length,
    },
    launchedAt: start + DEMO_LAUNCH,
    built: clamp01((time - start) / (DEMO_LAUNCH - 400)) * 3,
  };
}
