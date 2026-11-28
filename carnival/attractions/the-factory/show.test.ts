import { describe, expect, it } from 'vitest';
import {
  END_AGAIN,
  END_HERO,
  END_KEEP,
  END_MORE,
  NEXT,
  PLAY,
  SIGN_UP_CORNER,
  SKIP,
} from './buttons';
import type { Button } from './buttons';
import { CARDS, cardTop } from './rules';
import { advanceShow, END_DELAY, END_GUARD, newShow, QUIET, type Show } from './show';
import type { SquareKey } from '../../../src/northpole/square';
import { TOUR_STEPS } from './tour-copy';

const SIZE = 400;

/** A press at `x`, `y` in the drawing's 0 to 100 units, as the pointer a `SIZE` square gets. */
const press = (x: number, y: number, presses = 1) => ({
  x: (x * SIZE) / 100,
  y: (y * SIZE) / 100,
  down: true,
  presses,
});

/** A press in the middle of `button`. */
const on = (button: Button) =>
  press(button.box.x + button.box.w / 2, button.box.y + button.box.h / 2);

/** The show run frame by frame, 50 ms apart, from `from` to `to`, nobody touching it. */
function run(show: Show, from: number, to: number): Show {
  let next = show;
  for (let t = from; t <= to; t += 50) next = advanceShow(next, t, undefined, SIZE);
  return next;
}

describe('the show waiting for the visitor', () => {
  it("waits on the tour's first step for a tap, however long nobody touches it", () => {
    const start = advanceShow(undefined, 0, undefined, SIZE);
    expect(start.phase).toBe('tour');
    expect(start.fresh).toBe(true);
    const later = run(start, 0, 120_000);
    expect(later.phase).toBe('tour');
    expect(later.step).toBe(0);
    expect(later.fresh).toBe(true);
  });

  it('starts afresh when time runs backwards, keeping the best', () => {
    const show = { ...newShow(0, 30), last: 500 };
    const fresh = advanceShow(show, 100, undefined, SIZE);
    expect(fresh.last).toBe(100);
    expect(fresh.game.best).toBe(30);
  });
});

describe('the tour', () => {
  it('goes on a step with a tap anywhere, and stays there until the next', () => {
    const show = advanceShow(newShow(0), 10, press(40, 60), SIZE);
    expect(show.step).toBe(1);
    expect(show.fresh).toBe(false);
    expect(run(show, 20, QUIET - 100).step).toBe(1);
  });

  it('goes on a step with its Next button too', () => {
    expect(advanceShow(newShow(0), 10, on(NEXT), SIZE).step).toBe(1);
  });

  it('skips to the game demo, ready for a tap', () => {
    const show = advanceShow(newShow(0), 10, on(SKIP), SIZE);
    expect(show.phase).toBe('game');
    expect(show.game.mode).toBe('demo');
  });

  it('leads into the game from its last step, with a tap anywhere or on its big button', () => {
    const last = { ...newShow(0), step: TOUR_STEPS.length - 1, fresh: false, tapped: 0 };
    expect(advanceShow(last, 10, press(40, 60), SIZE).phase).toBe('game');
    expect(advanceShow(last, 10, on(PLAY), SIZE).phase).toBe('game');
  });

  it('goes back to its first step after a long quiet, for the next visitor', () => {
    const show = advanceShow(newShow(0), 10, press(40, 60), SIZE);
    expect(advanceShow(show, QUIET + 10, undefined, SIZE).step).toBe(1);
    const later = advanceShow(show, QUIET + 11, undefined, SIZE);
    expect(later.fresh).toBe(true);
    expect(later.step).toBe(0);
  });
});

describe('the tour by keys', () => {
  const keyed = (show: Show, time: number, ...keys: SquareKey[]) =>
    advanceShow(show, time, undefined, SIZE, keys);

  it('goes on with →, Enter or Space, and back with ←, never before the first step', () => {
    const start = newShow(0);
    expect(keyed(start, 10, 'right').step).toBe(1);
    expect(keyed(start, 10, 'enter').step).toBe(1);
    expect(keyed(start, 10, 'space').step).toBe(1);
    expect(keyed(start, 10, 'right', 'right', 'left')).toMatchObject({ step: 1, since: 10 });
    expect(keyed(start, 10, 'left').step).toBe(0);
    expect(keyed(start, 10, 'up', 'down').step).toBe(0);
  });

  it('counts a key as the visitor taking it, so a long quiet starts from its own last key', () => {
    const show = keyed(newShow(0), 10, 'up');
    expect(show).toMatchObject({ fresh: false, tapped: 10, step: 0 });
    expect(advanceShow(show, QUIET + 10, undefined, SIZE).step).toBe(0);
    expect(advanceShow(show, QUIET + 10, undefined, SIZE).fresh).toBe(false);
  });

  it('leads into the game after the last step, and leaves the game to taps', () => {
    const last = { ...newShow(0), step: TOUR_STEPS.length - 1, fresh: false, tapped: 0 };
    const game = keyed(last, 10, 'right', 'right', 'left');
    expect(game.phase).toBe('game');
    expect(game.game.mode).toBe('demo');
    expect(keyed(game, 20, 'left').phase).toBe('game');
  });
});

describe('the game', () => {
  const playing = (): Show => ({ ...newShow(0), phase: 'game', fresh: false, tapped: 0 });

  it('starts a round on a tap', () => {
    const show = advanceShow(playing(), 10, press(CARDS.x + 1, cardTop(0) + 1), SIZE);
    expect(show.game.mode).toBe('play');
  });

  it('asks for the sign-up link from its quiet corner, and starts nothing', () => {
    const signUp = advanceShow(playing(), 10, on(SIGN_UP_CORNER), SIZE);
    expect(signUp.ask).toEqual({ open: 0 });
    expect(signUp.game.mode).toBe('demo');
    expect(advanceShow(signUp, 20, undefined, SIZE).ask).toBeUndefined();
  });

  it('brings up the end card a moment after the last jam, with the score', () => {
    const over = { ...playing(), game: { ...playing().game, mode: 'over' as const, overAt: 0 } };
    expect(advanceShow(over, END_DELAY - 10, undefined, SIZE).phase).toBe('game');
    const end = advanceShow(over, END_DELAY + 10, undefined, SIZE);
    expect(end.phase).toBe('end');
    expect(end.since).toBe(END_DELAY + 10);
  });
});

describe('the end card', () => {
  const ended = (): Show => ({
    ...newShow(0),
    phase: 'end',
    since: 0,
    fresh: false,
    tapped: 0,
    last: 0,
  });
  const tap = (button: Button) => advanceShow(ended(), END_GUARD + 10, on(button), SIZE);

  it('asks for a booth, a visit to the Academy, the sign-up and the ways to keep in touch', () => {
    expect(tap(END_HERO).ask).toEqual({ open: 1 });
    expect(tap(END_MORE[0]).ask).toEqual({ visit: 'the-academy' });
    expect(tap(END_MORE[1]).ask).toEqual({ open: 0 });
    expect(END_KEEP.map((keep) => tap(keep).ask)).toEqual([{ open: 2 }, { open: 3 }, { open: 4 }]);
  });

  it('plays again, or goes back to the tour', () => {
    const [again, tour] = END_AGAIN;
    expect(tap(again).game.mode).toBe('play');
    expect(tap(tour).phase).toBe('tour');
  });

  it('takes no tap in its first moment, nor one off its buttons', () => {
    expect(advanceShow(ended(), END_GUARD - 10, on(END_HERO), SIZE).ask).toBeUndefined();
    const missed = advanceShow(ended(), END_GUARD + 10, press(50, 98), SIZE);
    expect(missed.ask).toBeUndefined();
    expect(missed.phase).toBe('end');
  });
});
