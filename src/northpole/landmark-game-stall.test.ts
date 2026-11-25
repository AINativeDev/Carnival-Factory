/**
 * Snowball Toss's game stall on the map: the elf's throw, the target it sets
 * wobbling, and the elves and lights round it, pinned so they draw the same.
 */
import { describe, expect, it } from 'vitest';
import { drawingOf, pinDrawing } from '../test-support/recording-canvas';
import { elf, outfit } from './elf';
import { drawGameStall, wobble } from './landmark-game-stall';
import { releaseFrom, throwingArm } from './landmark-game-stall-life';
import type { NorthPoleSquare } from './square';
import type { Plot } from './world';

const plot: Plot = {
  kind: 'attraction',
  id: 'snowball-toss',
  number: 4,
  x: 5,
  y: 5,
  w: 3,
  h: 3,
  door: { x: 6, y: 8 },
};
const square: NorthPoleSquare = {
  id: 'snowball-toss',
  name: 'Snowball Toss',
  description: '',
  draw: () => undefined,
};
/** One throw on the map, in ms. */
const THROW = 4200;

describe('the game stall’s throw', () => {
  it('flings the arm forward as the snowball leaves, and draws it back for the next', () => {
    expect(throwingArm(0).x).toBeGreaterThan(throwingArm(0.2).x);
    expect(throwingArm(0.2).x).toBeLessThan(throwingArm(0.99).x);
    expect(throwingArm(1)).toEqual(throwingArm(0));
  });

  it('lets go from the snowball it held, where its hand is as the throw comes round', () => {
    const feet = { x: 10, y: 100 };
    let hand = feet;
    drawingOf((ctx) => {
      hand = elf(ctx, feet.x, feet.y, {
        ...outfit(0.3),
        left: { x: 0, y: 0 },
        right: throwingArm(0.999),
      }).right;
    });
    const from = releaseFrom(feet);
    expect(from.x).toBeCloseTo(hand.x, 0);
    expect(from.y).toBeCloseTo(hand.y - 2, 0);
  });

  it('sets the middle target rocking when it lands, then still', () => {
    expect(wobble(0)).toBe(0);
    expect(Math.abs(wobble(0.05))).toBeGreaterThan(1);
    expect(wobble(0.3)).toBeCloseTo(0);
    expect(wobble(0.6)).toBe(0);
  });

  it('rocks gently: never more than three times a second', () => {
    const turns = Array.from({ length: 200 }, (_, k) => wobble(k / 200)).filter(
      (v, k, all) => k > 0 && Math.sign(v) !== Math.sign(all[k - 1] ?? 0),
    );
    expect(turns.length).toBeLessThanOrEqual(4);
  });
});

describe('the game stall', () => {
  it('draws the same through a throw, and differently at each moment of it', () => {
    const prints = [0, 0.1, 0.5, 0.9].map((t) =>
      pinDrawing((ctx, paint) => drawGameStall(ctx, plot, square, paint, t * THROW)),
    );
    expect(prints).toMatchSnapshot();
    expect(new Set(prints).size).toBe(prints.length);
  });

  it('puts a snowball in the thrower’s hand as it winds up', () => {
    const arcs = (t: number) =>
      drawingOf((ctx) => {
        drawGameStall(ctx, plot, square, () => undefined, t * THROW);
      }).filter(([name]) => name === 'arc').length;
    expect(arcs(0.5)).toBe(arcs(0.1) + 1);
  });
});
