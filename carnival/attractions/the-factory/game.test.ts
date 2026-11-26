import { describe, expect, it } from 'vitest';
import {
  advance,
  answer,
  DEMO_ANSWERS,
  type Game,
  JAM,
  legOf,
  legTime,
  levelOf,
  LIVES,
  newGame,
  OVER_GUARD,
  OVER_IDLE,
  SHIP_POINTS,
} from './game';
import { CARDS, cardTop, needFor, SIGN_UP } from './rules';

const SIZE = 200;

/** A press at `x`, `y` in the drawing's 0 to 100 units, as the pointer a `SIZE` square gets. */
const press = (x: number, y: number) => ({
  x: (x * SIZE) / 100,
  y: (y * SIZE) / 100,
  down: true,
  presses: 1,
});

/** A press on card `n`. */
const onCard = (n: number) => press(CARDS.x + 2, cardTop(n) + 2);

/** The game run frame by frame, 50 ms apart, from `from` to `to`, nobody touching it. */
function run(game: Game, from: number, to: number): Game {
  let next = game;
  for (let t = from; t <= to; t += 50) next = advance(next, t, undefined, SIZE);
  return next;
}

describe('the pace', () => {
  it('quickens every three booths, never below the floor', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(3)).toBe(2);
    expect(legTime(1)).toBe(2_700);
    expect(legTime(2)).toBeLessThan(legTime(1));
    expect(legTime(40)).toBe(900);
    expect(legOf({ ...newGame(0, 'play'), shipped: 6 })).toBe(legTime(3));
    expect(legOf({ ...newGame(0, 'demo'), shipped: 6 })).toBe(2_700);
  });
});

describe('the demo', () => {
  it('answers every station itself, ships booths and never jams', () => {
    const game = run(newGame(0), 0, legTime(1) * 4 + 200);
    expect(game.mode).toBe('demo');
    expect(game.shipped).toBe(1);
    expect(game.lives).toBe(LIVES);
    expect(game.score).toBe(0);
  });

  it('answers each leg once it is part way along', () => {
    const game = run(newGame(0), 0, legTime(1) * DEMO_ANSWERS + 60);
    expect(game.answer).toBe('right');
  });

  it('starts again when time runs backwards', () => {
    expect(advance(run(newGame(0), 0, 500), 100, undefined, SIZE).last).toBe(100);
  });
});

describe('a round', () => {
  it('starts with the first tap, fresh, keeping the best', () => {
    const game = advance({ ...newGame(0), best: 50, shipped: 4 }, 10, onCard(0), SIZE);
    expect(game.mode).toBe('play');
    expect(game.best).toBe(50);
    expect(game.shipped).toBe(0);
  });

  it('scores the right skill, more for a quick answer', () => {
    const game = newGame(0, 'play');
    const quick = advance(game, 10, onCard(game.need), SIZE);
    expect(quick.answer).toBe('right');
    expect(quick.score).toBe(20);
    const slow = answer({ ...game, ridden: legTime(1) / 2 }, game.need, 10);
    expect(slow.score).toBe(15);
    expect(answer(slow, game.need, 20)).toBe(slow);
  });

  it('jams on the wrong skill, halting the belt and costing a life', () => {
    const game = newGame(0, 'play');
    const wrong = advance(game, 10, onCard((game.need + 1) % 4), SIZE);
    expect(wrong.answer).toBe('wrong');
    expect(wrong.lives).toBe(LIVES - 1);
    expect(wrong.jamUntil).toBe(10 + JAM);
    expect(advance(wrong, 500, undefined, SIZE).ridden).toBe(wrong.ridden);
  });

  it('jams when the parcel reaches a station that got no skill', () => {
    const game = run(newGame(0, 'play'), 0, legTime(1) + 100);
    expect(game.lives).toBe(LIVES - 1);
    expect(game.leg).toBe(1);
    expect(game.need).toBe(needFor(1));
  });

  it('ships a booth through merge, for points', () => {
    const game: Game = { ...newGame(0, 'play'), leg: 3, answer: 'right', ridden: legTime(1) - 10 };
    const shipped = advance(game, 50, undefined, SIZE);
    expect(shipped.shipped).toBe(1);
    expect(shipped.score).toBe(SHIP_POINTS);
    expect(shipped.gifts).toEqual([50]);
    expect(shipped.leg).toBe(0);
  });

  it('ignores a tap off the cards', () => {
    const game = advance(newGame(0, 'play'), 10, press(50, 95), SIZE);
    expect(game.answer).toBe('none');
    expect(game.pops.at(-1)?.kind).toBe('tap');
  });

  it('ends on the last jam, and a tap after the guard plays again', () => {
    const last = { ...newGame(0, 'play'), lives: 1, score: 70, best: 40 };
    const over = advance(last, 10, onCard((last.need + 1) % 4), SIZE);
    expect(over.mode).toBe('over');
    expect(over.best).toBe(70);
    expect(advance(over, 10 + OVER_GUARD / 2, press(50, 90), SIZE).mode).toBe('over');
    const again = advance(over, 10 + OVER_GUARD + 1, press(50, 90), SIZE);
    expect(again.mode).toBe('play');
    expect(again.best).toBe(70);
  });

  it('keeps the round still under its last card', () => {
    const over: Game = { ...newGame(0, 'play'), mode: 'over', overAt: 0, shipped: 2 };
    const later = run(over, 0, legTime(1) * 4);
    expect(later.shipped).toBe(2);
    expect(later.ridden).toBe(0);
  });

  it('gives the last card back to the demo when nobody taps it', () => {
    const over: Game = { ...newGame(0, 'play'), mode: 'over', overAt: 0, best: 30 };
    const game = advance({ ...over, last: OVER_IDLE }, OVER_IDLE + 10, undefined, SIZE);
    expect(game.mode).toBe('demo');
    expect(game.best).toBe(30);
  });
});

describe('the sign-up buttons', () => {
  const corner = press(SIGN_UP.corner.x + 2, SIGN_UP.corner.y + 2);
  const card = press(SIGN_UP.card.x + 2, SIGN_UP.card.y + 2);

  it('ask for the link on the frame of the tap only, and start nothing', () => {
    const game = advance(newGame(0), 10, corner, SIZE);
    expect(game.link).toBe(true);
    expect(game.mode).toBe('demo');
    expect(advance(game, 20, undefined, SIZE).link).toBe(false);
  });

  it('is the big one on the last card', () => {
    const over: Game = { ...newGame(0, 'play'), mode: 'over', overAt: 0 };
    expect(advance(over, 10, card, SIZE).link).toBe(true);
    expect(advance(over, 10, corner, SIZE).link).toBe(false);
  });
});
