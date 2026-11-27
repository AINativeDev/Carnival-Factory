import { describe, expect, it } from 'vitest';
import { IDLE, REOPEN, TALLY, advance, newCurling, sweep, throwStone, type Curling } from './game';
import { ENDS, HOUSE, STONES, stoneAt } from './sheet';
import { skipAims, skipSweeps } from './skip';

/** A pointer over a 100-wide square: at (x, y), held or not, with `presses` since the last frame. */
const finger = (x: number, y: number, down: boolean, presses = 0) => ({ x, y, down, presses });

/** Moves `game` on to `until` a frame every 16 ms with nobody touching it. */
function wait(game: Curling, from: number, until: number) {
  let now = game;
  for (let time = from; time < until; time += 16) now = advance(now, time, undefined, 100);
  return now;
}

/** A game being played, with its stones thrown and stopped and its end ready to score. */
function endOver(time: number, stones = [stoneAt(HOUSE.s, 0, false)]) {
  const game = newCurling(time, 'play');
  game.stones = stones;
  game.thrown = STONES;
  game.phase = 'slide';
  return game;
}

describe('throwing', () => {
  it('starts a game on the first press, and throws on a drag back and let go', () => {
    let game = advance(newCurling(0, 'demo'), 16, finger(19, 66, true, 1), 100);
    expect(game.mode).toBe('play');
    expect(game.drag).not.toBeNull();
    game = advance(game, 32, finger(8, 66, true), 100);
    game = advance(game, 48, finger(8, 66, false), 100);
    expect(game.phase).toBe('slide');
    expect(game.thrown).toBe(1);
  });

  it('lets go when the finger lifts off the square, and nudges on a tap that drags nothing', () => {
    let game = newCurling(0, 'play');
    game = advance(game, 16, finger(30, 60, true, 1), 100);
    game = advance(game, 32, finger(18, 60, true), 100);
    expect(advance(game, 48, undefined, 100).phase).toBe('slide');
    const tapped = advance(newCurling(0, 'play'), 16, finger(30, 60, false, 1), 100);
    expect(tapped.phase).toBe('aim');
    expect(tapped.nudgedAt).toBe(16);
  });

  it('sweeps on taps while a stone slides', () => {
    const game = newCurling(0, 'play');
    throwStone(game, { power: 0.7, angle: 0 }, 0);
    advance(game, 16, finger(60, 66, false, 2), 100);
    expect(game.sweptUntil).toBeGreaterThan(16);
    expect(game.sweeps).toHaveLength(1);
    for (let n = 0; n < 6; n++) sweep(game, n);
    expect(game.sweeps).toHaveLength(4);
  });
});

describe('an end and a game', () => {
  it('scores an end once its stones stop, then sets out the next', () => {
    const game = advance(endOver(0), 16, undefined, 100);
    expect(game.phase).toBe('tally');
    expect(game.score).toBe(3);
    expect(game.ends).toEqual([3]);
    const next = advance(game, 16 + TALLY, undefined, 100);
    expect(next).toMatchObject({ end: 2, thrown: 0, phase: 'aim' });
    expect(next.stones).toHaveLength(2);
  });

  it('ends the game after the last end, keeps the best, and plays again on a tap', () => {
    const last = endOver(0);
    last.end = ENDS;
    last.best = 1;
    let game = advance(last, 16, undefined, 100);
    game = advance(game, 16 + TALLY, undefined, 100);
    expect(game).toMatchObject({ mode: 'over', best: 3 });
    expect(advance(game, 20 + TALLY, finger(50, 50, false, 1), 100).mode).toBe('over');
    const again = advance(game, 16 + TALLY + REOPEN, finger(50, 50, false, 1), 100);
    expect(again).toMatchObject({ mode: 'play', score: 0, best: 3, end: 1 });
  });

  it('gives the skip the pond back once a finished game sits idle', () => {
    const game = endOver(0);
    game.mode = 'over';
    game.endedAt = 0;
    expect(advance(game, IDLE, undefined, 100).mode).toBe('demo');
  });

  it('holds the stones still across a long gap, as when the tab was hidden', () => {
    const game = newCurling(0, 'play');
    throwStone(game, { power: 0.7, angle: 0 }, 0);
    advance(game, 16, undefined, 100);
    const at = game.stones.at(-1)?.s ?? 0;
    advance(game, 60_000, undefined, 100);
    expect(game.stones.at(-1)?.s).toBeCloseTo(at, 0);
  });
});

describe('the skip', () => {
  it('pulls back, lets go, and plays whole games on a loop, scoring nothing', () => {
    const game = wait(newCurling(0, 'demo'), 0, 240_000);
    expect(game.mode).toBe('demo');
    expect(game.score).toBe(0);
  });

  it('throws only once it has pulled back, and sweeps a stone that would stop short', () => {
    const game = newCurling(0, 'demo');
    expect(skipAims(game, 500)).toBeUndefined();
    expect(skipAims(game, 1_500)).toBeUndefined();
    expect(game.drag).not.toBeNull();
    const thrown = skipAims(game, 2_200);
    expect(thrown?.power).toBeGreaterThan(0.6);
    throwStone(game, { power: 0.4, angle: 0 }, 3_000);
    expect(skipSweeps(game, 3_100)).toBe(true);
    sweep(game, 3_100);
    expect(skipSweeps(game, 3_150)).toBe(false);
  });
});
