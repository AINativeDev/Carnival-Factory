/**
 * Making a cup of cocoa at the Hot Cocoa Stand: holding the pointer pours, and
 * once the cup is full each tap drops in the next topping. The last topping
 * serves the cup, which is carried away along the counter before a fresh one
 * comes. Plain functions, so the game is tested without drawing it.
 */

/** How long a wisp of steam takes to rise and fade, in milliseconds. */
export const RISE = 2_400;

/**
 * Wisp `n` of steam from a full cup at `time`: how far it has risen, from 0
 * (just leaving the cocoa) to 1 (gone), and how far it curls sideways, from
 * -1 to 1. Each wisp starts at its own moment, so they don't rise in step.
 */
export function steam(n: number, time: number): { rise: number; curl: number } {
  const rise = (((time / RISE + n * 0.37) % 1) + 1) % 1;
  return { rise, curl: Math.sin(rise * Math.PI * 2 + n) };
}

/** The toppings, in the order taps drop them in. */
export const TOPPINGS = ['marshmallows', 'cream', 'candy cane'] as const;

/** How long a held pointer takes to fill the cup, in milliseconds. */
export const FILL_MS = 2_500;

/** How long a served cup takes to slide away along the counter, in milliseconds. */
export const SERVE_MS = 1_200;

/** How long a topping takes to drop into the cup, in milliseconds. */
export const DROP_MS = 400;

/**
 * The longest step one frame pours for, in milliseconds, so a frame that was
 * away for a while (a hidden tab, a slow start) doesn't fill the cup at once.
 */
const MAX_STEP = 100;

/**
 * The stand's one memory of the visit: how full the cup is (0 to 1), how many
 * toppings are in it, how many cups were served, when the last one was served
 * and the last topping dropped, and the time of the last frame.
 */
export interface Cocoa {
  fill: number;
  toppings: number;
  served: number;
  servedAt: number;
  toppedAt: number;
  last: number;
}

/** An empty cup, and none served yet. */
export const FRESH: Cocoa = {
  fill: 0,
  toppings: 0,
  served: 0,
  servedAt: -Infinity,
  toppedAt: -Infinity,
  last: -Infinity,
};

/** What the stand reads of the pointer: whether it's held, and how many taps came. */
interface Press {
  down: boolean;
  presses: number;
}

/** The cup at `time`, after one frame of `pointer` (undefined when it's away). */
export function cocoaStep(cup: Cocoa, time: number, pointer: Press | undefined): Cocoa {
  const step = Math.min(Math.max(time - cup.last, 0), MAX_STEP);
  const last = time;
  if (cup.toppings === TOPPINGS.length) {
    // Being carried away: nothing to do until a fresh cup stands there.
    return time - cup.servedAt >= SERVE_MS
      ? { ...cup, fill: 0, toppings: 0, last }
      : { ...cup, last };
  }
  if (cup.fill < 1) {
    const fill = pointer?.down ? Math.min(1, cup.fill + step / FILL_MS) : cup.fill;
    return { ...cup, fill, last };
  }
  const presses = pointer?.presses ?? 0;
  if (presses === 0) return { ...cup, last };
  const toppings = Math.min(TOPPINGS.length, cup.toppings + presses);
  const servedNow = toppings === TOPPINGS.length;
  return {
    ...cup,
    toppings,
    toppedAt: time,
    served: servedNow ? cup.served + 1 : cup.served,
    servedAt: servedNow ? time : cup.servedAt,
    last,
  };
}

/** How far the served cup has slid away at `time`, from 0 (still here) to 1 (gone). */
export function served(cup: Cocoa, time: number): number {
  const since = time - cup.servedAt;
  return cup.toppings === TOPPINGS.length && since < SERVE_MS ? since / SERVE_MS : 0;
}

/** How high above the cup the newest topping still is at `time`, from 1 (just let go) to 0 (in). */
export function dropping(cup: Cocoa, time: number): number {
  return Math.max(0, 1 - (time - cup.toppedAt) / DROP_MS);
}

/** The line that tells a visitor what to do next. */
export function hint(cup: Cocoa): string {
  if (cup.toppings === TOPPINGS.length) return 'Served! Here comes another cup';
  if (cup.fill < 1) return 'Hold to pour the cocoa';
  return `Tap to add ${TOPPINGS[cup.toppings] ?? ''}`;
}
