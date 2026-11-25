import { describe, expect, it } from 'vitest';
import {
  advance,
  DOWN,
  flightOf,
  FLIGHT,
  type Game,
  HAND,
  hitAt,
  newGame,
  ROUND,
  SHELVES,
  snowmanX,
  topple,
} from './game';
import { callOf } from './scoreboard';

const SIZE = 200;
const FRAME = 16;

/** A tap at `x`, `y` in the game's 0 to 100 units. */
const tap = (x: number, y: number, presses = 1) => ({
  x: (x / 100) * SIZE,
  y: (y / 100) * SIZE,
  down: true,
  presses,
});

/** Plays frames from `game` up to `until`, with nobody's pointer over it unless `hovering`. */
function play(game: Game, until: number, hovering = false): Game {
  let g = game;
  const pointer = hovering ? { x: 0, y: 0, down: false, presses: 0 } : undefined;
  for (let t = g.last + FRAME; t <= until; t += FRAME) g = advance(g, t, pointer, SIZE);
  return g;
}

/** Throws at shelf `n`'s snowman where it will be when the snowball lands. */
function throwAt(game: Game, n: number, time: number): Game {
  const shelf = SHELVES[n] ?? SHELVES[0];
  return advance(game, time, tap(snowmanX(n, time + FLIGHT), shelf.y - 6), SIZE);
}

describe('the snowmen', () => {
  it('slide to and fro along their shelves, within their swing', () => {
    for (const [n, shelf] of SHELVES.entries()) {
      const xs = Array.from({ length: 50 }, (_, k) => snowmanX(n, k * 100));
      expect(Math.max(...xs) - 50).toBeLessThanOrEqual(shelf.swing);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(shelf.swing);
    }
    expect(snowmanX(9, 0)).toBe(50);
  });

  it('are hit only standing, by a snowball landing on them', () => {
    const game = newGame(0);
    const [bottom] = SHELVES;
    expect(hitAt(game, snowmanX(0, 0), bottom.y - 6, 0)).toBe(0);
    expect(hitAt(game, snowmanX(0, 0) + 9, bottom.y - 6, 0)).toBe(-1);
    expect(hitAt(game, snowmanX(0, 0), bottom.y + 9, 0)).toBe(-1);
    expect(hitAt({ ...game, down: [0, null, null] }, snowmanX(0, 0), bottom.y - 6, 0)).toBe(-1);
  });

  it('tip over when hit, lie down, then stand back up', () => {
    const game = { ...newGame(0), down: [1000, null, null] };
    expect(topple(game, 1, 1500)).toBe(0);
    expect(topple(game, 0, 1100)).toBeCloseTo(0.5);
    expect(topple(game, 0, 1000 + DOWN / 2)).toBe(1);
    expect(topple(game, 0, 1000 + DOWN - 200)).toBeCloseTo(0.5);
    expect(topple(game, 0, 1000 + DOWN)).toBe(0);
  });
});

describe('a snowball', () => {
  it('arcs from the hand up above its line, and is gone once it lands', () => {
    const ball = { x: 50, y: 40, at: 1000, played: true };
    expect(flightOf(ball, 1000)).toEqual(HAND);
    const middle = flightOf(ball, 1000 + FLIGHT / 2);
    expect(middle?.y).toBeLessThan((HAND.y + 40) / 2);
    expect(flightOf(ball, 1000 + FLIGHT)).toBeUndefined();
    expect(flightOf(ball, 999)).toBeUndefined();
  });
});

describe('a round', () => {
  it('throws a snowball at each tap, and scores the shelf it knocks down', () => {
    let game = throwAt(newGame(0), 2, 100);
    expect(game.throws).toHaveLength(1);
    expect(game.left).toBe(ROUND - 1);
    game = play(game, 100 + FLIGHT + FRAME, true);
    expect(game.throws).toHaveLength(0);
    expect(game.down[2]).not.toBeNull();
    expect(game.score).toBe(SHELVES[2].points);
    expect(game.best).toBe(game.score);
    // It stands up again after a while.
    game = play(game, 100 + FLIGHT + DOWN + 100, true);
    expect(game.down[2]).toBeNull();
  });

  it('scores nothing for a miss', () => {
    const game = play(advance(newGame(0), 100, tap(95, 95), SIZE), 1000, true);
    expect(game.score).toBe(0);
    expect(game.left).toBe(ROUND - 1);
  });

  it('throws a snowball for every press, however quick, up to the round', () => {
    let game = advance(newGame(0), 100, tap(95, 95, 6), SIZE);
    expect(game.throws).toHaveLength(6);
    expect(game.left).toBe(ROUND - 6);
    game = advance(game, 120, tap(95, 95, 6), SIZE);
    expect(game.throws).toHaveLength(ROUND);
    expect(game.left).toBe(0);
  });

  it('keeps every snowball inside the square, even one aimed at its edge', () => {
    const { throws } = advance(newGame(0), 100, tap(0, 100), SIZE);
    expect(throws.map(({ x, y }) => [x, y])).toEqual([[2, 98]]);
  });

  it('misses a snowman that was still down when the snowball landed, even on a late frame', () => {
    const [bottom] = SHELVES;
    // Knocked down at 700, it is up again at 700 + DOWN; a snowball landing before then misses.
    let game: Game = { ...newGame(0), last: 1000, down: [700, null, null] };
    game = advance(game, 1000, tap(snowmanX(0, 1000 + FLIGHT), bottom.y - 6), SIZE);
    game = advance(game, 700 + DOWN + 100, undefined, SIZE);
    expect(game.score).toBe(0);
    expect(game.down[0]).toBeNull();
  });

  it('stands a snowman back up on time when an old snowball lands on a late frame', () => {
    let game = throwAt(newGame(0), 2, 100);
    game = advance(game, 100 + FLIGHT + DOWN + 50, undefined, SIZE);
    expect(game.score).toBe(SHELVES[2].points);
    expect(game.down[2]).toBeNull();
  });

  it('ends when the snowballs run out, and a tap starts the next one, keeping the best', () => {
    let game: Game = { ...newGame(0), left: 1, score: 4, best: 4 };
    game = play(advance(game, 100, tap(95, 95), SIZE), 1000, true);
    expect(game.left).toBe(0);
    expect(callOf(game)).toBe('Tap to play again');
    game = advance(game, 1100, tap(95, 95), SIZE);
    expect(game.score).toBe(0);
    expect(game.best).toBe(4);
    expect(game.left).toBe(ROUND - 1);
  });

  it("waits for the round's last snowball to land before a tap starts the next", () => {
    let game: Game = { ...newGame(0), left: 1 };
    game = advance(game, 100, tap(95, 95), SIZE);
    game = advance(game, 200, tap(95, 95), SIZE);
    expect(game.left).toBe(0);
    expect(game.throws).toHaveLength(1);
  });

  it('says how to play on the scoreboard', () => {
    expect(callOf(newGame(0))).toBe('Tap to throw');
    expect(callOf({ ...newGame(0), left: 3 })).toBe('3 left');
  });

  it('starts again if time runs backwards', () => {
    const game = advance({ ...newGame(5000), score: 3 }, 100, undefined, SIZE);
    expect(game.score).toBe(0);
  });
});
