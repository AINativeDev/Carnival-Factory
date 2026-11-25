/**
 * The demo, which plays Snowball Toss with nobody playing so the map's view of
 * it still moves: how often it throws, and that it waits for a person.
 */
import { describe, expect, it } from 'vitest';
import { advance, type Game, newGame, ROUND } from './game';

const SIZE = 200;
const FRAME = 16;

/** Plays frames from `game` up to `until`, with nobody's pointer over it. */
function play(game: Game, until: number): Game {
  let g = game;
  for (let t = g.last + FRAME; t <= until; t += FRAME) g = advance(g, t, undefined, SIZE);
  return g;
}

describe('the demo', () => {
  it('throws now and then with nobody playing, and scores nothing', () => {
    const game = play(newGame(0), 10_000);
    expect(game.down.some((at) => at !== null) || game.throws.length > 0).toBe(true);
    expect(game.score).toBe(0);
    expect(game.left).toBe(ROUND);
  });

  it('hits a snowman it aims at', () => {
    let hits = 0;
    let game = newGame(0);
    for (let t = FRAME; t < 20_000; t += FRAME) {
      const before = game.down.filter((at) => at !== null).length;
      game = advance(game, t, undefined, SIZE);
      if (game.down.filter((at) => at !== null).length > before) hits++;
    }
    expect(hits).toBeGreaterThan(3);
  });

  it('throws no more often than every couple of seconds', () => {
    const throws = new Set<number>();
    let game = newGame(0);
    for (let t = FRAME; t < 20_000; t += FRAME) {
      game = advance(game, t, undefined, SIZE);
      for (const ball of game.throws) throws.add(ball.at);
    }
    const at = [...throws].sort((a, b) => a - b);
    const gaps = at.slice(1).map((t, k) => t - (at[k] ?? 0));
    expect(at.length).toBeGreaterThan(3);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(2_000);
  });

  it('throws at the same times however often it is drawn', () => {
    const coarse = advance(advance(newGame(0), 2_390, undefined, SIZE), 2_410, undefined, SIZE);
    let fine = newGame(0);
    for (const t of [600, 1_200, 2_390, 2_410]) fine = advance(fine, t, undefined, SIZE);
    expect(fine.throws).toEqual(coarse.throws);
  });

  it('throws on the beat itself, even when a frame comes late', () => {
    const first = advance(newGame(0), 4_100, undefined, SIZE);
    expect(first.throws).toEqual([]);
    expect(first.down).toEqual([3_000, null, null]);
    const next = advance(first, 4_800, undefined, SIZE);
    expect(next.throws.map((ball) => ball.at)).toEqual([4_800]);
  });

  it('is the same at any time whichever frames came before', () => {
    const at = (times: number[]) =>
      times.reduce((g, t) => advance(g, t, undefined, SIZE), newGame(0));
    expect(at([2_400, 2_500])).toEqual(at([2_500]));
    expect(at([4_100, 4_800, 5_000])).toEqual(at([5_000]));
    expect(at([2_390, 2_410, 7_300])).toEqual(at([7_300]));
  });

  it('waits a while after a person throws', () => {
    const game = play(
      advance(newGame(0), 100, { x: 190, y: 190, down: true, presses: 1 }, SIZE),
      5000,
    );
    expect(game.throws).toHaveLength(0);
    expect(game.down.every((at) => at === null)).toBe(true);
  });
});
