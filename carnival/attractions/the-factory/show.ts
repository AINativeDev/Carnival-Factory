/**
 * The Factory's show, in three parts: a short tour of what a software factory
 * is, tapped through step by step or skipped; the game, Feed the Loop; and an
 * end card with the ways on. Nothing moves on by itself: the tour waits on
 * each step for a tap, or →, Enter or Space (← goes back), so the visitor
 * reads at their own pace, and a long
 * quiet takes it back to the first step for the next visitor. `advanceShow`
 * moves the one `Show` on each frame, and `ask` holds what a tap this frame
 * asks of the page, if anything.
 */
import type { NorthPoleSquare, SquareKey, SquarePointer } from '../../../src/northpole/square';
import { choiceAt, type Choice, END_BUTTONS, PLAY_BUTTONS, tourButtons } from './buttons';
import { advance, type Game, newGame } from './game';
import { TOUR_STEPS } from './tour-copy';

/** What a square's `ask()` may answer: a link to open, or a place to visit. */
export type Ask = NonNullable<ReturnType<NonNullable<NorthPoleSquare['ask']>>>;

/** How long after a round's last jam its end card comes up, in ms. */
export const END_DELAY = 1_200;
/** How long the end card waits before its buttons take a tap, so a last frantic tap opens nothing, in ms. */
export const END_GUARD = 900;
/** After this long with no tap, the show goes back to the tour's first step, in ms. */
export const QUIET = 60_000;

/** All the Factory remembers, for one visit. */
export interface Show {
  /** The tour, the game or the end card. */
  phase: 'tour' | 'game' | 'end';
  /** The tour's step, from 0. */
  step: number;
  /** When this phase, or this step of the tour, began. */
  since: number;
  /** Whether the show waits for its first tap: nobody has tapped, or not for a long while. */
  fresh: boolean;
  /** When the latest tap came. */
  tapped: number;
  /** The `time` of the last frame. */
  last: number;
  game: Game;
  /** What this frame's tap asks of the page. */
  ask: Ask | undefined;
}

/** A fresh show at `time`, waiting on the tour's first step, keeping the visit's `best`. */
export function newShow(time: number, best = 0): Show {
  return {
    phase: 'tour',
    step: 0,
    since: time,
    fresh: true,
    tapped: -Infinity,
    last: time,
    game: newGame(time, 'demo', best),
    ask: undefined,
  };
}

/** The game started at `time`: the demo to tap into, or straight into a round. */
function toGame(show: Show, time: number, mode: Game['mode'] = 'demo'): Show {
  return { ...show, phase: 'game', since: time, game: newGame(time, mode, show.game.best) };
}

/** What `choice` does to the show at `time`: asks the page, or moves to another part. */
function choose(show: Show, choice: Choice, time: number): Show {
  switch (choice.kind) {
    case 'open':
      return { ...show, ask: { open: choice.link } };
    case 'visit':
      return { ...show, ask: { visit: 'the-academy' } };
    case 'next':
      return onAStep(show, time);
    case 'skip':
      return toGame(show, time);
    case 'again':
      return toGame(show, time, 'play');
    case 'tour':
      return { ...show, phase: 'tour', step: 0, since: time };
  }
}

/** The tour moved by the keys heard, in order: ← back a step, →, Enter or Space on, into the game after the last. */
function keyTour(show: Show, keys: readonly SquareKey[], time: number): Show {
  let next = show;
  for (const key of keys) {
    if (next.phase !== 'tour') break;
    if (key === 'left') next = { ...next, step: Math.max(0, next.step - 1), since: time };
    else if (key !== 'up' && key !== 'down') next = onAStep(next, time);
  }
  return next;
}

/** The tour on a step, into the game after the last. */
function onAStep(show: Show, time: number): Show {
  const step = show.step + 1;
  return step < TOUR_STEPS.length ? { ...show, step, since: time } : toGame(show, time);
}

/** A tap at `x`, `y` on the tour: its buttons, or anywhere else to go on a step, into the game after the last. */
function tapTour(show: Show, x: number, y: number, time: number): Show {
  const choice = choiceAt(tourButtons(show.step, TOUR_STEPS.length), x, y);
  return choice ? choose(show, choice, time) : onAStep(show, time);
}

/** The game one frame on: a tap on a link asks for it and stays out of the game; a round's end brings up the end card. */
function playOn(show: Show, time: number, pointer: SquarePointer | undefined, size: number): Show {
  const at =
    pointer && pointer.presses > 0
      ? { x: (pointer.x / size) * 100, y: (pointer.y / size) * 100 }
      : undefined;
  const link = at && choiceAt(PLAY_BUTTONS, at.x, at.y);
  const shown = link ? choose(show, link, time) : show;
  const game = advance(
    show.game,
    time,
    link && pointer ? { ...pointer, presses: 0 } : pointer,
    size,
  );
  const ended = game.mode === 'over' && time - game.overAt >= END_DELAY;
  return ended ? { ...shown, game, phase: 'end', since: time } : { ...shown, game };
}

/**
 * The show one frame on, at `time`, with the pointer as it is now in a `size`
 * square and the keys heard since the last frame. Time running backwards
 * starts it afresh.
 */
export function advanceShow(
  show: Show | undefined,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
  keys: readonly SquareKey[] = [],
): Show {
  if (!show || time < show.last) return newShow(time, show?.game.best);
  const presses = (pointer?.presses ?? 0) + keys.length;
  let next: Show = { ...show, last: time, ask: undefined };
  if (presses === 0 && !next.fresh && time - next.tapped > QUIET)
    next = newShow(time, next.game.best);
  if (presses > 0) next = { ...next, fresh: false, tapped: time };
  if (next.phase === 'tour') next = keyTour(next, keys, time);
  if (next.phase === 'game') return playOn(next, time, pointer, size);
  if (!pointer?.presses) return next;
  const x = (pointer.x / size) * 100;
  const y = (pointer.y / size) * 100;
  if (next.phase === 'tour') return tapTour(next, x, y, time);
  const choice = time - next.since >= END_GUARD ? choiceAt(END_BUTTONS, x, y) : undefined;
  return choice ? choose(next, choice, time) : next;
}
