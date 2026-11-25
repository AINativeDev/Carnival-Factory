import { type Build, partsOf } from './parts';

/** The top hops from the bench to the mat for this long, in milliseconds. */
export const CARRY = 700;
/** Once it stops, it tips over and lies on the mat this long before it goes back on the bench. */
export const REST = 2_500;

/** 0 to 1, slow at both ends. */
export function ease(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/** `t` held between 0 and 1, so a moment past either end of a stage stays at that end. */
export function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

/** How a top does on the mat: how long it spins, in milliseconds, and how much it wobbles. */
export interface Test {
  spin: number;
  wobble: number;
}

/**
 * How `build` does when it is set spinning at `launchedAt`. The parts decide
 * most of it, and the moment it is let go adds up to a tenth either way.
 */
export function testOf(build: Build, launchedAt: number): Test {
  const { body, handle } = partsOf(build);
  const luck = Math.sin(launchedAt * 12.9898) * 43_758.5453;
  const knack = 0.9 + 0.2 * (luck - Math.floor(luck));
  return {
    spin: Math.round((body.spin + handle.spin) * knack),
    wobble: body.wobble * handle.wobble,
  };
}

/** A word for how much a top wobbled. */
export function rating(wobble: number): string {
  if (wobble < 0.75) return 'STEADY';
  if (wobble < 1.3) return 'WOBBLY';
  return 'WILD';
}

/** Where a test stands: hopping to the mat, spinning, lying tipped over, or back on the bench. */
export type Stage = 'carry' | 'spin' | 'rest' | 'done';

/** Where a test stands `ms` after the top was let go, for a top that spins `spin` ms. */
export function stageAt(ms: number, spin: number): { stage: Stage; progress: number } {
  if (ms < CARRY) return { stage: 'carry', progress: clamp01(ms / CARRY) };
  if (ms < CARRY + spin) return { stage: 'spin', progress: (ms - CARRY) / spin };
  if (ms < CARRY + spin + REST) return { stage: 'rest', progress: (ms - CARRY - spin) / REST };
  return { stage: 'done', progress: 1 };
}

/** How fast a fresh top spins, in radians per second: about one turn a second. */
const SPIN_SPEED = 6;

/** The angle a top that spins for `spin` ms has turned through `ms` after it was set down. */
export function spinAngle(ms: number, spin: number): number {
  const s = clamp01(ms / spin);
  // The speed falls off smoothly to nothing: (1 - s)^2, integrated.
  return ((SPIN_SPEED * spin) / 1000 / 3) * (1 - (1 - s) ** 3);
}

/** How fast the top turns `ms` after it was set down, 0 to 1 of its first speed. */
export function spinSpeed(ms: number, spin: number): number {
  return (1 - clamp01(ms / spin)) ** 2;
}

/** How far the top leans, in pixels at its handle: nothing while fast, more as it slows. */
export function wobble(ms: number, test: Test): number {
  const s = clamp01(ms / test.spin);
  return Math.sin(ms / 140) * Math.min(6, 3.5 * test.wobble) * s ** 3;
}

/** Where the top is, tip first, while it is carried from `from` to `to`, `progress` 0 to 1. */
export function carryTip(
  progress: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
): { x: number; y: number } {
  const t = ease(progress);
  const hop = Math.sin(t * Math.PI) * 8;
  return {
    x: Math.round(from.x + (to.x - from.x) * t),
    y: Math.round(from.y + (to.y - from.y) * t - hop),
  };
}

/**
 * How the stopped top lies, `progress` 0 to 1 through its rest: it leans
 * further for a moment, tip still on the mat, then lies on its side.
 */
export function restPose(progress: number): { lying: boolean; lean: number } {
  const settle = ease(progress * 4);
  return settle < 1 ? { lying: false, lean: 2 + settle * 3 } : { lying: true, lean: 0 };
}
