/**
 * Ring Grab, the carousel's game. Your reindeer, with the elf riding it, goes
 * round; a ring arm by the carousel's left side holds out a ring, and a tap
 * as your reindeer passes the arm grabs it: a silver ring is 1, a rare gold
 * one 5. A tap with no ring in reach is a miss, and three misses end the
 * ride. Every ring caught speeds the carousel up. With nobody playing, the elf
 * grabs every ring itself on a gentle demo ride.
 *
 * The attraction keeps one `Grab` between frames, its only state for a visit.
 */
import { AT_PACE, stepRide, turnOf, type Ride } from './ride';

/** Who is riding: the elf's own demo, a visitor, or a visitor's ride just over. */
export type Mode = 'demo' | 'play' | 'over';

/** Something to show for a moment: a ring caught (and its worth) or a miss, and when. */
interface Moment {
  at: number;
  worth: number;
}

/** Everything the carousel remembers for one visit. */
export interface Grab {
  mode: Mode;
  ride: Ride;
  seed: number;
  rings: number;
  caught: number;
  misses: number;
  best: number;
  /** The pass whose ring was taken, so it's gone until the next one. */
  taken: number;
  /** The last few rings caught and misses (worth 0), newest last. */
  moments: Moment[];
  overAt: number | null;
  lastTap: number;
}

/**
 * Where round the ride your reindeer is when a tap reaches the ring best, in
 * radians: front left, coming round past the arm in full view under the canopy.
 */
export const CENTRE = -0.75;
/** How far either side of that a tap still reaches the ring, in radians. */
export const WINDOW = 0.3;
/** The misses a ride allows. */
export const MISSES = 3;
/** How fast a ride starts, as times the carousel's own pace, and how much each ring adds. */
export const START_PACE = 1.8;
const PER_RING = 0.12;
/** How long after a ride ends a tap waits before it starts the next. */
export const GUARD = 900;
/** How long a ride waits for a tap before the elf's demo takes over again. */
export const IDLE = 20_000;

/** A steady pseudo-random number from 0 to 1 for `seed` and `n`. */
function hash(seed: number, n: number): number {
  const s = Math.sin(seed * 12.9898 + n * 78.233) * 43_758.5453;
  return s - Math.floor(s);
}

/** Whether the ring offered on pass `pass` is gold: about one in six. */
export const isGold = (seed: number, pass: number) => hash(seed, pass) < 0.17;

/** How fast a ride goes after catching `caught` rings, as times the carousel's own pace. */
export const paceFor = (caught: number) => START_PACE + caught * PER_RING;

/**
 * Where your reindeer is against the arm when the ride is `turn` radians
 * round: which pass it's on, how far past the window's start (radians), and
 * whether a tap reaches the ring now.
 */
export function passOf(turn: number): { pass: number; into: number; inReach: boolean } {
  const u = (turn - (CENTRE - WINDOW)) / (Math.PI * 2);
  const pass = Math.floor(u);
  const into = (u - pass) * Math.PI * 2;
  return { pass, into, inReach: into <= WINDOW * 2 };
}

/** How near your reindeer is to the middle of the window, from 1 there to 0 far off. */
export function nearness(turn: number): number {
  const { into } = passOf(turn);
  const off = Math.min(Math.abs(into - WINDOW), Math.PI * 2 - into + WINDOW);
  return Math.max(0, 1 - off / (WINDOW * 3));
}

/** The pass whose ring the arm holds out at `turn`: this one in the window, then the next. */
export function offered(turn: number): number {
  const { pass, inReach } = passOf(turn);
  return inReach ? pass : pass + 1;
}

/** A new ride, or the demo, from `time`, carrying on the carousel's turn. */
export function newGrab(time: number, mode: Mode, best: number, ride: Ride = AT_PACE): Grab {
  return {
    ...{ mode, ride, seed: (Math.floor(time) % 9_973) + 1, rings: 0, caught: 0, misses: 0 },
    ...{ best, taken: -Infinity, moments: [], overAt: null, lastTap: time },
  };
}

/** The ride with a moment to show added, keeping the last few. */
const remember = (grab: Grab, moment: Moment): Grab => ({
  ...grab,
  moments: [...grab.moments, moment].slice(-6),
});

/** Takes the ring in reach at `turn`, if there is one; the demo's elf does too. */
function take(grab: Grab, turn: number, time: number): Grab {
  const { pass } = passOf(turn);
  const worth = isGold(grab.seed, pass) ? 5 : 1;
  const rings = grab.rings + worth;
  return remember({ ...grab, rings, caught: grab.caught + 1, taken: pass }, { at: time, worth });
}

/** A visitor's tap at `time` with the ride `turn` round: a ring grabbed, or a miss. */
function tap(grab: Grab, turn: number, time: number): Grab {
  const { pass, inReach } = passOf(turn);
  const played = { ...grab, lastTap: time };
  if (inReach && grab.taken !== pass) return take(played, turn, time);
  const misses = grab.misses + 1;
  const missed = remember({ ...played, misses }, { at: time, worth: 0 });
  if (misses < MISSES) return missed;
  return { ...missed, mode: 'over', overAt: time, best: Math.max(grab.best, grab.rings) };
}

/** How fast the carousel should go now: the demo's own pace, a ride's, or easing off once over. */
function paceOfGrab(grab: Grab): number {
  return grab.mode === 'play' ? paceFor(grab.caught) : 1;
}

/**
 * Moves the ride on to `time` with `presses` taps since the last frame: the
 * carousel turns, the demo's elf grabs each ring at the middle of the window,
 * taps start a ride, grab or miss, and a ride left alone goes back to the demo.
 */
export function advance(grab: Grab, time: number, presses = 0): Grab {
  let now: Grab = { ...grab, ride: stepRide(grab.ride, paceOfGrab(grab), time) };
  const turn = turnOf(now.ride, time);
  const away = now.mode === 'over' ? (now.overAt ?? time) : now.lastTap;
  if (now.mode !== 'demo' && presses === 0 && time - away > IDLE)
    now = newGrab(time, 'demo', now.best, now.ride);
  if (now.mode === 'demo') {
    const { pass, into } = passOf(turn);
    if (into >= WINDOW && into <= WINDOW * 2 && now.taken !== pass) now = take(now, turn, time);
  }
  for (let n = 0; n < presses; n++) {
    if (now.mode === 'demo') return newGrab(time, 'play', now.best, now.ride);
    if (now.mode === 'over') {
      const ready = time - (now.overAt ?? time) >= GUARD;
      return ready ? newGrab(time, 'play', now.best, now.ride) : now;
    }
    now = tap(now, turn, time);
  }
  return now;
}
