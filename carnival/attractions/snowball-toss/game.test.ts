import { describe, expect, it } from 'vitest';
import { DRIFT, FLIGHT, windAt } from './flight';
import { advance, type Game, GUARD, IDLE, newGame, ROUND, ROUNDS } from './game';
import { land, multiplier } from './landing';
import { callOf } from './scoreboard';
import { DOWN, GOLD_POINTS, goldShelf, paceOf, SHELVES, snowmanX } from './targets';

const SIZE = 200;
const FRAME = 16;

/** A tap at `x`, `y` in the game's 0 to 100 units. */
const tap = (x: number, y: number, presses = 1) => ({
  x: (x / 100) * SIZE,
  y: (y / 100) * SIZE,
  down: true,
  presses,
});

/** Plays frames from `game` up to `until`, with the pointer resting over it. */
function play(game: Game, until: number): Game {
  let g = game;
  const pointer = { x: 0, y: 0, down: false, presses: 0 };
  for (let t = g.last + FRAME; t <= until; t += FRAME) g = advance(g, t, pointer, SIZE);
  return g;
}

/** Throws at shelf `n`'s snowman where it will be when the snowball lands, allowing for the wind. */
function throwAt(game: Game, n: number, time: number): Game {
  const shelf = SHELVES.at(n) ?? SHELVES[0];
  const x = snowmanX(n, time + FLIGHT, paceOf(game.round)) - windAt(game.round, time) * DRIFT;
  return advance(game, time, tap(x, shelf.y - 6), SIZE);
}

/** A game whose round `round` is on, started at `time` with every snowball to throw. */
const inRound = (round: number, time = 0): Game => ({
  ...newGame(time),
  started: true,
  round,
  roundStart: time,
  playedAt: time,
});

describe('a round', () => {
  it('throws a snowball at each tap, and scores the shelf it knocks down', () => {
    let game = throwAt(newGame(0), 2, 100);
    expect(game.started).toBe(true);
    expect(game.throws).toHaveLength(1);
    expect(game.left).toBe(ROUND - 1);
    game = play(game, 100 + FLIGHT + FRAME);
    expect(game.throws).toHaveLength(0);
    expect(game.down[2]).not.toBeNull();
    expect(game.score).toBe(SHELVES[2].points);
    expect(game.best).toBe(game.score);
    expect(game.pops.at(-1)?.points).toBe(SHELVES[2].points);
    // It stands up again after a while.
    game = play(game, 100 + FLIGHT + DOWN + 100);
    expect(game.down[2]).toBeNull();
  });

  it('scores nothing for a miss, splashes, and breaks the combo', () => {
    const game = play(advance({ ...newGame(0), combo: 2 }, 100, tap(95, 95), SIZE), 1000);
    expect(game.score).toBe(0);
    expect(game.combo).toBe(0);
    expect(game.left).toBe(ROUND - 1);
    expect(game.pops.at(-1)?.points).toBe(0);
  });

  it('doubles a second hit in a row, and triples the ones after', () => {
    expect([0, 1, 2, 3, 7].map(multiplier)).toEqual([1, 1, 2, 3, 3]);
    let game = throwAt(newGame(0), 0, 100);
    game = throwAt(play(game, 1_200), 1, 1_200);
    game = play(game, 1_200 + FLIGHT + FRAME);
    expect(game.combo).toBe(2);
    expect(game.score).toBe(SHELVES[0].points + SHELVES[1].points * 2);
  });

  it('scores the gold snowman’s bonus', () => {
    const shelf = goldShelf(0, 1, 3_000);
    let game = inRound(1);
    game = throwAt(game, shelf, 3_000 - FLIGHT + 1);
    game = play(game, 3_100);
    expect(game.score).toBe(GOLD_POINTS);
    expect(game.pops.at(-1)?.gold).toBe(true);
  });

  it('throws a snowball for every press, however quick, up to the round', () => {
    let game = advance(newGame(0), 100, tap(95, 95, 6), SIZE);
    expect(game.throws).toHaveLength(6);
    game = advance(game, 120, tap(95, 95, 6), SIZE);
    expect(game.throws).toHaveLength(ROUND);
    expect(game.left).toBe(0);
  });

  it('keeps every snowball aimed inside the square, even one aimed at its edge', () => {
    const { throws } = advance(newGame(0), 100, tap(0, 100), SIZE);
    expect(throws.map(({ x, y }) => [x, y])).toEqual([[2, 98]]);
  });

  it('misses a snowman that was still down when the snowball landed, even on a late frame', () => {
    const [bottom] = SHELVES;
    let game: Game = { ...inRound(1), last: 1000, down: [700, null, null] };
    const x = snowmanX(0, 1000 + FLIGHT) - windAt(1, 1000) * DRIFT;
    game = advance(game, 1000, tap(x, bottom.y - 6), SIZE);
    game = advance(game, 700 + DOWN + 100, undefined, SIZE);
    expect(game.score).toBe(0);
    expect(game.down[0]).toBeNull();
  });

  it('ends once its last snowball lands, and waits a moment before a tap goes on', () => {
    let game: Game = { ...inRound(1), left: 1, score: 4 };
    game = advance(game, 100, tap(95, 95), SIZE);
    game = advance(game, 200, tap(95, 95), SIZE);
    expect(game.throws).toHaveLength(1);
    expect(game.ended).toBeNull();
    game = play(game, 1000);
    expect(game.ended).toBe(100 + FLIGHT);
    expect(callOf(game)).toBe('Tap for round 2');
    expect(advance(game, 100 + FLIGHT + GUARD / 2, tap(50, 50), SIZE).round).toBe(1);
    game = advance(game, 100 + FLIGHT + GUARD, tap(50, 50), SIZE);
    expect(game.round).toBe(2);
    expect(game.left).toBe(ROUND);
    expect(game.score).toBe(4);
    expect(game.throws).toHaveLength(0);
  });

  it('after the last round, a tap starts a new game, keeping the best', () => {
    let game: Game = { ...inRound(ROUNDS), left: 0, score: 9, best: 9, ended: 0 };
    expect(callOf(game)).toBe('Tap to play again');
    game = advance(game, GUARD, tap(50, 50), SIZE);
    expect(game).toMatchObject({ round: 1, score: 0, best: 9, bestBefore: 9, left: ROUND });
  });

  it('says how to play on the scoreboard', () => {
    expect(callOf(newGame(0))).toBe('Tap to throw');
    expect(callOf({ ...inRound(1), left: 3 })).toBe('3 left');
  });

  it('hands back to the demo when left alone, and starts again if time runs backwards', () => {
    const game = { ...inRound(2), playedAt: 0, best: 6 };
    expect(advance(game, IDLE + 1, undefined, SIZE)).toMatchObject({ started: false, best: 6 });
    const back = advance({ ...newGame(5000), score: 3, best: 3 }, 100, undefined, SIZE);
    expect(back).toMatchObject({ score: 0, best: 3 });
  });

  it('lands nothing before its time', () => {
    const ball = { x: 50, y: 50, at: 1_000, wind: 0, played: true };
    expect(land({ ...newGame(0), throws: [ball] }, 1_100).throws).toEqual([ball]);
  });
});
