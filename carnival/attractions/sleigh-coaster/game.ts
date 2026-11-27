/**
 * Boost & Brake, the coaster's game: hold to push the sleigh on, let go to
 * coast. It needs speed to get over each hill, but crossing a crest too fast
 * flies it off the rails into a snowdrift, and the run ends there. Presents
 * float over some of the crests for a sleigh flying at the right height. A
 * run lasts the clock; it scores a point a metre and more for each present,
 * and the best run of the visit is kept. With nobody playing, an elf drives.
 *
 * The attraction keeps one `Coaster` between frames, the only state it has,
 * and `advance` moves it on from `time` in fixed steps.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import { elfPushes, presents, reached } from './course';
import { AT_STATION, step, STEP, type Sleigh } from './physics';

/** How long a run's clock gives, in ms. */
export const RUN = 45_000;
/** How long the sleigh tumbles into the snowdrift before the run's card, in ms. */
export const TUMBLE = 1_600;
/** What each present caught scores. */
export const PRESENT_POINTS = 50;
/** How long the elf drives before it starts again from the station, in ms. */
export const DEMO_RUN = 30_000;
/** How long the run's card waits before a tap starts the next, so a last push doesn't skip it. */
export const GUARD = 700;
/** How long the run's card waits for a tap before the elf takes over again, in ms. */
export const IDLE = 25_000;
/** The most time one frame plays: after a long pause the ride doesn't race to catch up. */
const MAX_GAP = 250;
/** One step, in ms. */
const STEP_MS = STEP * 1_000;

type Phase = 'demo' | 'ride' | 'tumble' | 'over';

/** All the coaster remembers, for one visit. */
export interface Coaster {
  phase: Phase;
  sleigh: Sleigh;
  /** When this run, or the elf's, left the station. */
  start: number;
  /** The time played up to. */
  at: number;
  /** The presents caught this run, by their place on the course. */
  caught: number[];
  /** When the last present was caught. */
  caughtAt: number;
  /** When the run ended: flown off the rails, or the clock run out. */
  ended: number | null;
  /** Whether the sleigh was being pushed on the last step. */
  pushing: boolean;
  best: number;
}

/** A run's score: a point for each metre from the station, and more for each present. */
export function scoreOf(coaster: Coaster): number {
  return Math.floor(coaster.sleigh.x) + coaster.caught.length * PRESENT_POINTS;
}

/** How much of the run's clock is left at `time`, in ms. */
export function clockLeft(coaster: Coaster, time: number): number {
  const until = coaster.ended ?? time;
  return Math.max(0, RUN - (until - coaster.start));
}

/** When the run's card comes up: as the run ends, or once the sleigh has tumbled into the snow. */
export function cardAt(coaster: Coaster): number | null {
  if (coaster.ended === null) return null;
  return coaster.ended + (coaster.sleigh.off ? TUMBLE : 0);
}

/** A fresh run from the station at `time`: a rider's, or the elf's in `demo`. */
function leave(phase: Phase, time: number, best: number): Coaster {
  return {
    ...{ phase, sleigh: AT_STATION, start: time, at: time, caught: [] },
    ...{ caughtAt: -Infinity, ended: null, pushing: false, best },
  };
}

/** The coaster at the start of a visit: the elf driving. */
export const newCoaster = (time: number): Coaster => leave('demo', time, 0);

/** The coaster one step on at `t`, pushed or not. */
function ride(coaster: Coaster, t: number, pushing: boolean): Coaster {
  const sleigh = step(coaster.sleigh, pushing);
  const fresh = reached(sleigh, presents()).filter((n) => !coaster.caught.includes(n));
  const caught = fresh.length ? [...coaster.caught, ...fresh] : coaster.caught;
  const caughtAt = fresh.length ? t : coaster.caughtAt;
  return { ...coaster, sleigh, caught, caughtAt, pushing, at: t };
}

/** The run ended at `t`: tumbling into the snow, or over with its score counted. */
function end(coaster: Coaster, t: number, phase: 'tumble' | 'over'): Coaster {
  const best = phase === 'over' ? Math.max(coaster.best, scoreOf(coaster)) : coaster.best;
  return { ...coaster, phase, ended: coaster.ended ?? t, best, pushing: false };
}

/** The coaster one step on at `t`, by its phase. */
function tick(coaster: Coaster, t: number, down: boolean): Coaster {
  const { phase, start, ended } = coaster;
  if (phase === 'demo') {
    const next = ride(coaster, t, elfPushes(coaster.sleigh));
    return next.sleigh.off || t - start >= DEMO_RUN ? leave('demo', t, coaster.best) : next;
  }
  if (phase === 'ride') {
    const next = ride(coaster, t, down);
    if (next.sleigh.off) return end(next, t, 'tumble');
    return t - start >= RUN ? end(next, t, 'over') : next;
  }
  if (phase === 'tumble' && ended !== null && t - ended >= TUMBLE) return end(coaster, t, 'over');
  return { ...coaster, at: t };
}

/**
 * The coaster at `time`, with the pointer as it is now. A tap while the elf
 * drives starts a run, and so does one on the run's card once it has shown a
 * moment. Holding pushes the sleigh while a run is on.
 */
export function advance(
  coaster: Coaster,
  time: number,
  pointer: SquarePointer | undefined,
): Coaster {
  if (time < coaster.at) return { ...newCoaster(time), best: coaster.best };
  let next = coaster;
  const presses = pointer?.presses ?? 0;
  const { phase, best } = next;
  const card = cardAt(next) ?? Infinity;
  if (presses > 0 && phase === 'demo') next = leave('ride', time, best);
  if (presses > 0 && phase === 'over' && time - card >= GUARD) next = leave('ride', time, best);
  if (next.phase === 'over' && time - card >= IDLE) return leave('demo', time, best);
  let t = Math.max(next.at, time - MAX_GAP);
  const down = pointer?.down ?? false;
  while (t + STEP_MS <= time) {
    t += STEP_MS;
    next = tick(next, t, down);
  }
  return next;
}
