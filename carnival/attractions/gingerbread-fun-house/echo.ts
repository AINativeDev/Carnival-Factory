/**
 * Icing Echo, the fun house's memory game. The house plays a tune by lighting
 * its notes in turn; you tap them back in the same order. Each round adds one
 * note, the tune gets quicker, a fifth and a sixth note join, and from round
 * 4 the fun-house mirrors swap two notes' places once the tune has played, so
 * you follow each note by its colour, not where it was. A wrong note ends the
 * game with the house wobbling; the score is the rounds echoed. With nobody
 * playing, the house plays and echoes its own tunes, on a loop.
 *
 * The attraction keeps one `Echo` between frames, its only state for a visit.
 */
import { bare, decorate, type Decorating } from './decorating';
import { rimOf, SLOTS, slotAt } from './slots';
import { CHEER, LEAD, notesIn, pick, stepOf, SWAP, SWAP_FROM } from './tune';

/** Who is playing: the house's own demo, a visitor, or a visitor's game just lost. */
type Mode = 'demo' | 'play' | 'over';
/** Where a round is: the house playing, the mirrors swapping, your echo, the cheer, or lost. */
export type Phase = 'show' | 'swap' | 'echo' | 'cheer' | 'over';

/** A tap's feedback: where on the house, when, and how it went (`note` is -1 off a note). */
interface Tap {
  x: number;
  y: number;
  at: number;
  note: number;
  kind: 'right' | 'wrong' | 'idle';
}

/** Everything the fun house remembers for one visit. */
export interface Echo {
  mode: Mode;
  seed: number;
  round: number;
  /** The tune, as notes: each note is 0 to 5, its own colour. */
  tune: number[];
  /** Which place each note sits at while the house plays, and for the echo, after any swap. */
  before: readonly number[];
  places: readonly number[];
  roundAt: number;
  echoed: number;
  doneAt: number | null;
  overAt: number | null;
  /** The note a wrong tap should have been. */
  missed: number;
  best: number;
  lastTap: number;
  taps: Tap[];
  treats: Decorating;
}

/** How many rounds the house's demo plays before it starts again. */
export const DEMO_ROUNDS = 5;
/** How long after a wrong note a tap waits before it starts a new game, so a late tap doesn't. */
export const GUARD = 900;
/** How long a visitor's game waits for a tap before the house's demo takes over again. */
export const IDLE = 30_000;

/** Where each note starts: in its own place, the first four on the house's front and roof. */
export const HOME: readonly number[] = [0, 1, 2, 3, 4, 5];

/**
 * A new game from `time`: round 1's tune of two notes, with the notes where
 * the last game left them, so nothing jumps.
 */
export function newEcho(
  time: number,
  mode: 'demo' | 'play',
  best: number,
  places: readonly number[] = HOME,
): Echo {
  const seed = (Math.floor(time) % 9_973) + 1;
  return {
    ...{ mode, seed, round: 1, tune: [pick(seed, 0, 4), pick(seed, 1, 4)] },
    ...{ before: places, places, roundAt: time, echoed: 0, doneAt: null, overAt: null },
    ...{ missed: -1, best, lastTap: time, taps: [], treats: bare() },
  };
}

/** `places` with the notes `a` and `b` in each other's place. */
function swapped(places: readonly number[], a: number, b: number): readonly number[] {
  return places.map((slot, note) =>
    note === a ? (places.at(b) ?? slot) : note === b ? (places.at(a) ?? slot) : slot,
  );
}

/**
 * The next round from `time`: one note longer, a new note's first time when
 * one joins, and from `SWAP_FROM` two notes the mirrors will swap.
 */
export function nextRound(echo: Echo, time: number): Echo {
  const round = echo.round + 1;
  const count = notesIn(round);
  const joins = count > notesIn(echo.round);
  const note = joins ? count - 1 : pick(echo.seed, echo.tune.length, count);
  const a = pick(echo.seed, 100 + round, count);
  const b = (a + 1 + pick(echo.seed, 200 + round, count - 1)) % count;
  return {
    ...echo,
    ...{ round, tune: [...echo.tune, note], before: echo.places, roundAt: time },
    ...{ echoed: 0, doneAt: null },
    places: round >= SWAP_FROM ? swapped(echo.places, a, b) : echo.places,
  };
}

/** When the house has played the round's tune, and when the echo starts, after any swap. */
export function timeline(echo: Echo): { played: number; echo: number } {
  const played = echo.roundAt + LEAD + echo.tune.length * stepOf(echo.round);
  const swaps = echo.before.some((slot, note) => slot !== echo.places.at(note));
  return { played, echo: played + (swaps ? SWAP : 0) };
}

/** Which part of its round the game is in at `time`. */
export function phaseOf(echo: Echo, time: number): Phase {
  if (echo.mode === 'over') return 'over';
  if (echo.doneAt !== null) return 'cheer';
  const { played, echo: from } = timeline(echo);
  if (time < played) return 'show';
  return time < from ? 'swap' : 'echo';
}

/** The places the notes in play sit at, for the echo. */
const inUse = (echo: Echo) => echo.places.slice(0, notesIn(echo.round));

/** The game with one more tap's feedback, keeping the last few. */
function withTap(echo: Echo, tap: Tap): Echo {
  return { ...echo, taps: [...echo.taps, tap].slice(-6) };
}

/** A tap on the note at place `slot` (or off the notes, -1) at `x`, `y` on the house at `time`. */
function echoTap(echo: Echo, slot: number, x: number, y: number, time: number): Echo {
  const note = echo.places.findIndex((at, n) => at === slot && n < notesIn(echo.round));
  if (phaseOf(echo, time) !== 'echo' || note < 0)
    return withTap(echo, { x, y, at: time, note: -1, kind: 'idle' });
  const wanted = echo.tune.at(echo.echoed) ?? -1;
  if (note !== wanted) {
    const lost = { ...echo, mode: 'over' as const, overAt: time, missed: wanted };
    return withTap(lost, { x, y, at: time, note, kind: 'wrong' });
  }
  const echoed = echo.echoed + 1;
  const done = echoed >= echo.tune.length;
  const best = done && echo.mode === 'play' ? Math.max(echo.best, echo.round) : echo.best;
  const right = { ...echo, echoed, best, doneAt: done ? time : null };
  const rim = rimOf(slot, x, y, echo.treats.count);
  right.treats = decorate(echo.treats, rim.x, rim.y, time);
  return withTap(right, { x, y, at: time, note, kind: 'right' });
}

/** One press at `x`, `y` on the house at `time`: start a game, or echo a note. */
function press(echo: Echo, x: number, y: number, time: number): Echo {
  const fresh = () => newEcho(time, 'play', echo.best, echo.places);
  if (echo.mode === 'demo') return withTap(fresh(), idle(x, y, time));
  if (echo.mode === 'over') {
    const ready = time - (echo.overAt ?? time) >= GUARD;
    return ready ? fresh() : withTap(echo, idle(x, y, time));
  }
  return echoTap({ ...echo, lastTap: time }, slotAt(x, y, inUse(echo)), x, y, time);
}

const idle = (x: number, y: number, at: number): Tap => ({ x, y, at, note: -1, kind: 'idle' });

/** The house's demo echoing its own tune: each note tapped right on its step. */
function autoEcho(echo: Echo, time: number): Echo {
  let now = echo;
  const step = stepOf(echo.round);
  while (phaseOf(now, time) === 'echo' && time >= timeline(now).echo + (now.echoed + 1) * step) {
    const slot = now.places.at(now.tune.at(now.echoed) ?? 0) ?? 0;
    const at = SLOTS.at(slot)?.at ?? { x: 50, y: 50 };
    now = echoTap(now, slot, at.x, at.y, time);
  }
  return now;
}

/**
 * Moves the game on to `time`, with `presses` taps at `x`, `y` on the house
 * since the last frame: the next round after a cheer, the demo's own echo,
 * and the house's demo again once a visitor has left.
 */
export function advance(echo: Echo, time: number, x = 0, y = 0, presses = 0): Echo {
  let now = echo;
  const away = now.mode === 'over' ? (now.overAt ?? time) : now.lastTap;
  if (now.mode !== 'demo' && presses === 0 && time - away > IDLE)
    now = newEcho(time, 'demo', now.best, now.places);
  if (now.doneAt !== null && time >= now.doneAt + CHEER) {
    const again = now.mode === 'demo' && now.round >= DEMO_ROUNDS;
    now = again ? newEcho(time, 'demo', now.best, now.places) : nextRound(now, time);
  }
  if (now.mode === 'demo') now = autoEcho(now, time);
  for (let n = 0; n < presses; n++) {
    const before = now.mode;
    now = press(now, x, y, time);
    // A tap that starts a game is only that: the others in its frame wait.
    if (before !== 'play' && now.mode === 'play') break;
  }
  return now;
}
