import { describe, expect, it } from 'vitest';
import { GIFT_FLIGHT, giftFlight, SLEIGH } from './effects';
import { newGame } from './game';
import { pressOf } from './hud';
import { alongOf, cardAt, CARDS, cardTop, needFor, POP_LIFE, SKILLS, stepPops } from './rules';
import { stationLight } from './stations';
import { sparkAt } from './text';
import { COG, cogTurn, fountainGift, LETTERS, letterPop, litOf } from './tower';

describe('the cards', () => {
  it('finds the card under a point, and misses the gaps and the sides', () => {
    expect(cardAt(CARDS.x + 1, cardTop(2) + 1)).toBe(2);
    expect(cardAt(CARDS.x + 1, cardTop(1) + CARDS.h + CARDS.gap / 2)).toBe(-1);
    expect(cardAt(CARDS.x + CARDS.w + 1, cardTop(0) + 1)).toBe(-1);
    expect(cardAt(CARDS.x + 1, CARDS.y - 1)).toBe(-1);
    expect(cardAt(CARDS.x + 1, cardTop(SKILLS.length) + 1)).toBe(-1);
  });
});

describe('the round', () => {
  it('asks for every skill, the same way every visit', () => {
    const asked = new Set(Array.from({ length: 40 }, (_, n) => needFor(n)));
    expect([...asked].sort()).toEqual([0, 1, 2, 3]);
    expect(needFor(7)).toBe(needFor(7));
  });

  it('rides each leg from the station before to its own', () => {
    expect(alongOf(0, 0)).toBeCloseTo(0.75);
    expect(alongOf(0, 1)).toBeCloseTo(0);
    expect(alongOf(2, 0.5)).toBeCloseTo(0.375);
  });

  it('keeps only the latest pops', () => {
    let pops = stepPops([], { kind: 'tap', at: 0, points: 0 });
    for (let n = 1; n < 12; n++) pops = stepPops(pops, { kind: 'tap', at: n, points: 0 });
    expect(pops).toHaveLength(8);
    expect(pops.at(-1)?.at).toBe(11);
  });
});

describe('the stations', () => {
  it('light the station the parcel reaches, and fade as it leaves', () => {
    expect(stationLight(1, 1, 1)).toBeCloseTo(1);
    expect(stationLight(1, 1, 0.5)).toBe(0);
    expect(stationLight(0, 1, 0)).toBe(1);
    expect(stationLight(0, 1, 0.5)).toBe(0);
    expect(stationLight(3, 1, 1)).toBe(0);
  });
});

describe('the cards pressing', () => {
  it('presses the tapped card, and the demo’s answer, for a moment', () => {
    const tap = { kind: 'tap' as const, at: 0, x: CARDS.x + 1, y: cardTop(2) + 1, points: 0 };
    const game = { ...newGame(0, 'play'), pops: [tap] };
    expect(pressOf(game, 2, 0)).toBe(1);
    expect(pressOf(game, 1, 0)).toBe(0);
    expect(pressOf(game, 2, POP_LIFE)).toBe(0);
    const demo = { ...newGame(0), pops: [{ kind: 'right' as const, at: 0, leg: 0, points: 0 }] };
    expect(pressOf(demo, demo.need, 10)).toBeGreaterThan(0);
  });
});

describe('the tower', () => {
  it('lights a letter per booth, all five staying lit in a round', () => {
    expect(LETTERS.join('')).toBe('TESSL');
    expect(litOf({ ...newGame(0, 'play'), shipped: 2 })).toBe(2);
    expect(litOf({ ...newGame(0, 'play'), shipped: 9 })).toBe(5);
    expect(litOf({ ...newGame(0, 'demo'), shipped: 7 })).toBe(1);
  });

  it('swells a newly lit letter and settles it', () => {
    expect(letterPop(-1)).toBe(1);
    expect(letterPop(300)).toBeCloseTo(1.45);
    expect(letterPop(700)).toBe(1);
  });

  it('turns the cog faster with every letter', () => {
    expect(cogTurn(4_000, 5)).toBeGreaterThan(cogTurn(4_000, 0));
  });

  it('tumbles the gifts from the top down onto the snow', () => {
    const start = fountainGift(0, 0);
    expect(start.x).toBeCloseTo(COG.x);
    expect(fountainGift(0, 2_000).y).toBeGreaterThan(start.y);
  });
});

describe('the sleigh', () => {
  it('catches every booth flying from merge', () => {
    const end = giftFlight(1);
    expect(end.x).toBeCloseTo(SLEIGH.x);
    expect(GIFT_FLIGHT).toBeGreaterThan(0);
  });
});

describe('the sparks', () => {
  it('spread out from the middle', () => {
    expect(sparkAt(0, 8, 0, 5)).toEqual({ x: 0, y: 0 });
    expect(Math.hypot(sparkAt(2, 8, 1, 5).x, sparkAt(2, 8, 1, 5).y)).toBeGreaterThan(1);
  });
});
