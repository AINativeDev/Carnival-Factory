import { describe, expect, it } from 'vitest';
import { CARD_BUTTON, SIGN, takeAsk, TICKETS_LINK } from './buttons';
import { advance, tap } from './game';
import { KEYNOTE, PER_TALK } from './program';
import { bubbleOf, type Question } from './questions';
import {
  BACK_TO_DEMO,
  type Game,
  GOOD_HYPE,
  hypeAt,
  MISS_HYPE,
  newGame,
  RESTART_AFTER,
  START_HYPE,
  STRAY_HYPE,
} from './state';

const SIZE = 200;
const FRAME = 16;

/** A question from seat `seat`, asked at `born`. */
const question = (id: number, seat: number, good: boolean, born: number): Question => ({
  id,
  seat,
  line: 0,
  good,
  born,
  life: 4_000,
});

/** Taps the middle of question `q`'s bubble at `time`. */
function tapOn(game: Game, q: Question, time: number): Game {
  const box = bubbleOf(q);
  return tap(game, box.x + box.w / 2, box.y + box.h / 2, time);
}

/** A round being played from `time`, nothing asked yet. */
const playing = (time: number): Game => tap(newGame(time), 50, 70, time);

/** Plays frames from `game` up to `until`, with nobody's pointer over it. */
function play(game: Game, until: number): Game {
  let g = game;
  for (let t = g.last + FRAME; t <= until; t += FRAME) g = advance(g, t, undefined, SIZE);
  return g;
}

describe('the demo', () => {
  it('asks questions and passes the mic to the good ones on its own, scoring nothing', () => {
    const game = play(newGame(0), 12_000);
    expect(game.mode).toBe('demo');
    expect(game.asked).toBeGreaterThan(4);
    expect(game.answered).toBeGreaterThan(1);
    expect(game.score).toBe(0);
    expect(hypeAt(game, 12_000)).toBe(START_HYPE);
  });

  it('goes round the keynote again and again', () => {
    expect(play(newGame(0), 120_000).answered).toBeLessThan(KEYNOTE);
  });
});

describe('a round', () => {
  it('starts with a tap, handing the visitor their badge', () => {
    const game = playing(500);
    expect(game.mode).toBe('play');
    expect(game.badge).toEqual({ kind: 'attendee', at: 500 });
    expect(game.score).toBe(0);
    expect(hypeAt(game, 500)).toBe(START_HYPE);
  });

  it('scores a good question and fills the hype, more for a quick answer', () => {
    const q = question(1, 3, true, 1_000);
    const game = { ...playing(1_000), up: [q] };
    const quick = tapOn(game, q, 1_100);
    const slow = tapOn(game, q, 4_500);
    expect(quick.score).toBeGreaterThan(slow.score);
    expect(slow.score).toBeGreaterThanOrEqual(10);
    expect(quick.up).toEqual([]);
    expect(quick.answered).toBe(1);
    expect(quick.cheers.at(-1)).toEqual({ seat: 3, at: 1_100 });
    expect(hypeAt(quick, 1_100)).toBeCloseTo(hypeAt(game, 1_100) + GOOD_HYPE);
    expect(quick.pops.at(-1)?.good).toBe(true);
  });

  it('drains the hype for an off-topic question, and scores nothing', () => {
    const q = question(1, 3, false, 1_000);
    const game = tapOn({ ...playing(1_000), up: [q] }, q, 1_100);
    expect(game.score).toBe(0);
    expect(game.up).toEqual([]);
    expect(hypeAt(game, 1_100)).toBeCloseTo(START_HYPE - 0.3 - STRAY_HYPE);
    expect(game.pops.at(-1)?.text).toBe('Off topic!');
  });

  it('ignores a tap on nobody', () => {
    const game = { ...playing(1_000), up: [question(1, 3, true, 1_000)] };
    expect(tap(game, 50, 98, 1_100)).toBe(game);
  });

  it('drains the hype for a good question left waiting, but not for an off-topic one', () => {
    const start = { ...playing(0), nextAt: Infinity };
    const missed = advance({ ...start, up: [question(1, 3, true, 0)] }, 4_100, undefined, SIZE);
    expect(hypeAt(missed, 4_000)).toBeCloseTo(START_HYPE - 12 - MISS_HYPE);
    expect(missed.pops.at(-1)?.text).toBe('Missed!');
    const ignored = advance({ ...start, up: [question(1, 3, false, 0)] }, 4_100, undefined, SIZE);
    expect(hypeAt(ignored, 4_000)).toBeCloseTo(START_HYPE - 12);
    expect(ignored.up).toEqual([]);
  });

  it('asks quicker as the keynote goes on', () => {
    const early = play(playing(0), 6_000);
    const late = play({ ...playing(0), answered: 25, hype: 100 }, 6_000);
    expect(late.asked).toBeGreaterThan(early.asked);
  });

  it('brings on the next speaker every few good questions', () => {
    const q = question(1, 3, true, 1_000);
    const game = tapOn({ ...playing(0), answered: PER_TALK - 1, up: [q] }, q, 1_200);
    expect(game.talkAt).toBe(1_200);
  });

  it('ends in a standing ovation once the whole keynote is answered, with a gold badge', () => {
    const q = question(1, 3, true, 1_000);
    const game = tapOn({ ...playing(0), answered: KEYNOTE - 1, score: 300, up: [q] }, q, 1_200);
    expect(game.mode).toBe('won');
    expect(game.best).toBe(game.score);
    expect(game.badge).toEqual({ kind: 'superfan', at: 1_200 });
    expect(game.up).toEqual([]);
  });

  it('goes quiet when the hype runs out, keeping the best score', () => {
    const game = play({ ...playing(0), score: 40, nextAt: Infinity }, 25_000);
    expect(game.mode).toBe('lost');
    expect(game.best).toBe(40);
    expect(game.endedAt).toBeLessThanOrEqual(20_100);
  });

  it('plays again on a tap once the end card has been up a moment', () => {
    const lost: Game = { ...playing(0), mode: 'lost', endedAt: 1_000, best: 40, last: 1_000 };
    expect(tap(lost, 50, 70, 1_000 + RESTART_AFTER / 2)).toBe(lost);
    const again = tap(lost, 50, 70, 1_000 + RESTART_AFTER);
    expect(again.mode).toBe('play');
    expect(again.best).toBe(40);
    expect(again.score).toBe(0);
  });

  it('goes back to the demo when nobody plays again', () => {
    const lost: Game = { ...playing(0), mode: 'lost', endedAt: 1_000, best: 40, last: 1_000 };
    const later = advance(lost, 1_000 + BACK_TO_DEMO + 1, undefined, SIZE);
    expect(later.mode).toBe('demo');
    expect(later.best).toBe(40);
  });

  it('starts again if time runs backwards', () => {
    const game = advance({ ...playing(5_000), score: 30, best: 30 }, 100, undefined, SIZE);
    expect(game.mode).toBe('demo');
    expect(game.best).toBe(30);
  });

  it('counts every tap a frame carries', () => {
    const game = advance(newGame(0), 100, { x: 100, y: 196, down: true, presses: 3 }, SIZE);
    expect(game.mode).toBe('play');
  });
});

describe('the tickets buttons', () => {
  const middle = (area: typeof SIGN) => [area.x + area.w / 2, area.y + area.h / 2] as const;

  it('ask for the tickets link once, after a tap on the sign, in any mode', () => {
    const game = tap(newGame(0), ...middle(SIGN), 100);
    expect(game.mode).toBe('demo');
    const first = takeAsk(game);
    expect(first.ask).toEqual({ open: TICKETS_LINK });
    expect(takeAsk(first.game).ask).toBeUndefined();
    expect(takeAsk(newGame(0)).ask).toBeUndefined();
  });

  it("ask from the end card's big button too, but only on the end card", () => {
    const lost: Game = { ...playing(0), mode: 'lost', endedAt: 0 };
    expect(tap(lost, ...middle(CARD_BUTTON), 50).asking).toBe(true);
    expect(tap(lost, ...middle(CARD_BUTTON), 5_000).mode).toBe('lost');
    expect(tap(playing(0), ...middle(CARD_BUTTON), 50).asking).toBe(false);
  });
});
