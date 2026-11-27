/**
 * How Icing Echo's notes look at a moment: how brightly each one glows, as
 * the house plays it, as you echo it, in the cheer and on the note you
 * missed, and where it is while the mirrors carry it to another place. Every
 * glow swells and fades over hundreds of milliseconds, so nothing flashes.
 */
import type { Point } from '../../../src/northpole/diorama';
import { phaseOf, timeline, type Echo } from './echo';
import { SLOTS } from './slots';
import { CHEER, ease, LEAD, stepOf, swell, SWAP } from './tune';

/** How long a note you tap glows, in ms. */
export const TAP_GLOW = 520;

/** How lit `note` is at `time`, from 0 to 1. */
export function lightOf(echo: Echo, note: number, time: number): number {
  const phase = phaseOf(echo, time);
  const step = stepOf(echo.round);
  let lit = 0;
  if (phase === 'show') {
    echo.tune.forEach((played, n) => {
      if (played !== note) return;
      const from = echo.roundAt + LEAD + n * step;
      lit = Math.max(lit, swell((time - from) / (step * 0.85)));
    });
  }
  for (const tap of echo.taps) {
    if (tap.note === note && tap.kind !== 'idle')
      lit = Math.max(lit, swell((time - tap.at) / TAP_GLOW));
  }
  if (phase === 'cheer' && echo.doneAt !== null) {
    const t = (time - echo.doneAt - 180 - note * 90) / (CHEER * 0.6);
    lit = Math.max(lit, t > 0 && t < 1 ? 0.7 * Math.sin(Math.PI * t) : 0);
  }
  if (phase === 'over' && echo.overAt !== null && note === echo.missed) {
    // The note you should have tapped breathes slowly, so you can see it.
    const since = time - echo.overAt;
    lit = Math.max(lit, ease((since - 300) / 600) * (0.55 + 0.25 * Math.sin(since / 450)));
  }
  return lit;
}

/** How far the mirrors have carried the notes they swap at `time`, from 0 to 1. */
export function swapOf(echo: Echo, time: number): number {
  return ease((time - timeline(echo).played) / SWAP);
}

/** The place `note` is drawn at: where it sat while the house played, until the swap. */
export function slotOf(echo: Echo, note: number, time: number): number {
  const after = echo.places.at(note) ?? note;
  if (time >= timeline(echo).played) return after;
  return echo.before.at(note) ?? after;
}

/**
 * Where `note` is on the house at `time`, and how far through its trip
 * through the mirrors (`moving` rises and falls from 0 to 1, 0 when still).
 * A swapped pair passes on two arcs, one above and one below, so they never
 * meet head on.
 */
export function whereIs(echo: Echo, note: number, time: number): { at: Point; moving: number } {
  const from = SLOTS.at(echo.before.at(note) ?? note)?.at ?? { x: 50, y: 50 };
  const to = SLOTS.at(echo.places.at(note) ?? note)?.at ?? from;
  const t = swapOf(echo, time);
  if ((from.x === to.x && from.y === to.y) || t >= 1) return { at: to, moving: 0 };
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const bulge = Math.sin(Math.PI * t) * 9;
  const length = Math.hypot(dx, dy) || 1;
  return {
    at: {
      x: from.x + dx * t + (dy / length) * bulge,
      y: from.y + dy * t - (dx / length) * bulge,
    },
    moving: Math.sin(Math.PI * t),
  };
}
