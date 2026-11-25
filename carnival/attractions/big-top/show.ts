/**
 * The circus show's rules, as plain functions so they can be tested: what a
 * tap does, where the acrobat and the juggled balls are, where the spotlight
 * shines and how far the big finish has got. Everything is in the scene's 0 to
 * 100 units, and everything moves from `time`.
 */
import type { SquarePointer } from '../../../src/northpole/square';

/** How many taps of the drum roll build up to a big finish. */
export const DRUMROLL = 5;
/** How long the acrobat is in the air after a tap, in milliseconds. */
export const LEAP = 1_400;
/** How long the big finish lasts, in milliseconds. */
export const FINALE = 2_400;
/** How long one juggled ball takes to go round both hands, in milliseconds. */
export const JUGGLE = 1_500;

/** The ring on the snow: its middle and how far it reaches across and back. */
export const RING = { x: 50, y: 68, rx: 24, ry: 12 };
/** Where the acrobat leaves the springboard and where they land. */
export const BOARD = { x: 32, y: 70 };
const LANDING = { x: 66, y: 70 };

/** What the show remembers between frames: the last tap, the taps so far and the last big finish. */
export interface Show {
  leapt: number;
  taps: number;
  finale: number;
}

export const OPENING: Show = { leapt: -Infinity, taps: 0, finale: -Infinity };

/**
 * The show after `presses` taps at `time`. Each tap sends the acrobat off the
 * springboard again and beats the drum once; the tap that fills the drum roll
 * starts the big finish, unless one is still playing, so tapping fast can never
 * make it flash.
 */
export function tapped(show: Show, presses: number, time: number): Show {
  if (presses <= 0) return show;
  const taps = show.taps + presses;
  const filled = Math.floor(taps / DRUMROLL) > Math.floor(show.taps / DRUMROLL);
  const playing = time - show.finale < FINALE;
  return { leapt: time, taps, finale: filled && !playing ? time : show.finale };
}

/** How many beats of the drum roll are lit, from 0 to DRUMROLL - 1. */
export function drumBeats(show: Show): number {
  return show.taps % DRUMROLL;
}

/**
 * Where the acrobat is `since` milliseconds after leaving the springboard, and
 * how far round their somersault they are, or undefined once they have landed.
 */
export function acrobatAt(since: number): { x: number; y: number; turn: number } | undefined {
  if (since < 0 || since >= LEAP) return undefined;
  const t = since / LEAP;
  return {
    x: BOARD.x + (LANDING.x - BOARD.x) * t,
    y: BOARD.y + (LANDING.y - BOARD.y) * t - Math.sin(t * Math.PI) * 38,
    turn: t * Math.PI * 2,
  };
}

/**
 * Where ball `ball` of three is at `time` for the elf juggling at `x`, hands
 * at `y`: a cascade, high over from the left hand to the right and low back
 * under. `lift` throws them higher, for the big finish.
 */
export function juggledBall(
  ball: number,
  x: number,
  y: number,
  time: number,
  lift = 0,
): { x: number; y: number } {
  const phase = (((time / JUGGLE + ball / 3) % 1) + 1) % 1;
  if (phase < 0.6) {
    const s = phase / 0.6;
    return { x: x - 3 + 6 * s, y: y - Math.sin(s * Math.PI) * (9 + lift) };
  }
  const s = (phase - 0.6) / 0.4;
  return { x: x + 3 - 6 * s, y: y - Math.sin(s * Math.PI) * 1.5 };
}

/**
 * Where the spotlight shines at `time`: on the ring under the pointer, kept
 * inside the ring, or sweeping slowly round it while nobody points.
 */
export function spotlightOn(pointer: SquarePointer | undefined, size: number, time: number) {
  if (!pointer) {
    return {
      x: RING.x + Math.sin(time / 2_400) * RING.rx * 0.6,
      y: RING.y + Math.cos(time / 3_100) * RING.ry * 0.4,
    };
  }
  const dx = ((pointer.x * 100) / size - RING.x) / RING.rx;
  const dy = ((pointer.y * 100) / size - RING.y) / RING.ry;
  const reach = Math.hypot(dx, dy);
  const k = reach > 1 ? 1 / reach : 1;
  return { x: RING.x + dx * k * RING.rx, y: RING.y + dy * k * RING.ry };
}

/** How bright the big finish is `since` milliseconds after it began: up and back down, 0 to 1. */
export function finaleGlow(since: number): number {
  if (since < 0 || since >= FINALE) return 0;
  return Math.sin((since / FINALE) * Math.PI);
}
