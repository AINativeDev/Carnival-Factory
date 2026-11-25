/**
 * How the sled moves: the slope's speed through a run and the penguin's steering
 * across the track, as plain functions of time so a frame never depends on how
 * many frames came before it.
 */
import { clamp, EDGE } from './course';

/** The slope's speed at the start of a run, in metres a second. */
export const BASE = 9;
/** How much the slope's speed grows each second of a run, in metres a second. */
const ACCEL = 0.3;
/** The slope's top speed, which it reaches about 37 seconds into a run, in metres a second. */
export const TOP = 20;

/** How fast the penguin can cross the track, in lanes a second. */
export const STEER = 3;
/** How far one tap on either half of the drawing steers. */
export const TAP_STEP = 0.8;

/** How far the slope has carried the sled `seconds` into a run, speeding up to `TOP`. */
export function distanceFor(seconds: number): number {
  const t = Math.max(0, seconds);
  const toTop = (TOP - BASE) / ACCEL;
  if (t <= toTop) return BASE * t + 0.5 * ACCEL * t * t;
  return BASE * toTop + 0.5 * ACCEL * toTop * toTop + TOP * (t - toTop);
}

/** The slope's speed `seconds` into a run, in metres a second. */
export function speedFor(seconds: number): number {
  return Math.min(TOP, BASE + ACCEL * Math.max(0, seconds));
}

/** Where on the track the pointer at `x` across a `size` square steers to. */
export function laneOf(x: number, size: number): number {
  return clamp((x / size - 0.5) * 2 * EDGE * 1.15, -EDGE, EDGE);
}

/** Moves `from` towards `to` by at most `step`. */
export function toward(from: number, to: number, step: number): number {
  if (Math.abs(to - from) <= step) return to;
  return from + Math.sign(to - from) * step;
}

/**
 * Where across the track the penguin is as it passes `at` metres, on a frame
 * that carries it from `from` to `to` metres while it steers from `lane` towards
 * `target` by at most `step`.
 */
export function laneAt(
  lane: number,
  target: number,
  step: number,
  from: number,
  to: number,
  at: number,
): number {
  const part = to > from ? clamp((at - from) / (to - from), 0, 1) : 1;
  return toward(lane, target, step * part);
}
