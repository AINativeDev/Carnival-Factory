import { describe, expect, it } from 'vitest';
import { DRIFT, flightOf, FLIGHT, HAND, landingOf, windAt } from './flight';
import { newGame } from './game';
import { hitAt } from './landing';
import { DOWN, GOLD_FOR, goldShelf, paceOf, SHELVES, snowmanX, topple } from './targets';

describe('the snowmen', () => {
  it('slide to and fro along their shelves, within their swing, faster each round', () => {
    for (const [n, shelf] of SHELVES.entries()) {
      const xs = Array.from({ length: 50 }, (_, k) => snowmanX(n, k * 100));
      expect(Math.max(...xs) - 50).toBeLessThanOrEqual(shelf.swing);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(shelf.swing);
    }
    expect(snowmanX(9, 0)).toBe(50);
    expect(paceOf(1)).toBe(1);
    expect(paceOf(2)).toBeGreaterThan(paceOf(1));
    expect(paceOf(3)).toBeGreaterThan(paceOf(2));
    expect(paceOf(9)).toBe(paceOf(3));
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
    expect(topple(null, 1500)).toBe(0);
    expect(topple(1000, 1100)).toBeCloseTo(0.5);
    expect(topple(1000, 1000 + DOWN / 2)).toBe(1);
    expect(topple(1000, 1000 + DOWN - 200)).toBeCloseTo(0.5);
    expect(topple(1000, 1000 + DOWN)).toBe(0);
  });

  it('turn gold one at a time now and then, a shelf higher each turn', () => {
    expect(goldShelf(0, 1, 1_000)).toBe(-1);
    const first = goldShelf(0, 1, 3_000);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(goldShelf(0, 1, 3_000 + GOLD_FOR)).toBe(-1);
    expect(goldShelf(0, 1, 9_500)).toBe((first + 1) % SHELVES.length);
  });
});

describe('a snowball', () => {
  it('arcs from the hand up above its line, and is gone once it lands', () => {
    const ball = { x: 50, y: 40, at: 1000, wind: 0, played: true };
    expect(flightOf(ball, 1000)).toEqual(HAND);
    const middle = flightOf(ball, 1000 + FLIGHT / 2);
    expect(middle?.y).toBeLessThan((HAND.y + 40) / 2);
    expect(flightOf(ball, 1000 + FLIGHT)).toBeUndefined();
    expect(flightOf(ball, 999)).toBeUndefined();
  });

  it('bends with the wind, and lands blown aside', () => {
    const ball = { x: 50, y: 40, at: 0, wind: 1, played: true };
    expect(landingOf(ball)).toEqual({ x: 50 + DRIFT, y: 40 });
    expect(flightOf(ball, FLIGHT - 1)?.x).toBeGreaterThan(50 + DRIFT * 0.9);
    expect(landingOf({ ...ball, wind: -0.5 }).x).toBeCloseTo(50 - DRIFT / 2);
  });

  it('meets a wind that gusts, and blows harder each round', () => {
    const strength = (round: number) =>
      Math.max(...Array.from({ length: 60 }, (_, k) => Math.abs(windAt(round, k * 200))));
    expect(strength(2)).toBeGreaterThan(strength(1));
    expect(strength(3)).toBeGreaterThan(strength(2));
    expect(windAt(1, 0)).not.toBe(windAt(1, 3_000));
    expect(windAt(0, 0)).toBe(windAt(1, 0));
  });
});
