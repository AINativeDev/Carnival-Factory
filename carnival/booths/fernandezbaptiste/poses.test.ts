import { describe, expect, it } from 'vitest';
import type { Card } from './deck';
import { cardInAir, posesOf } from './poses';
import { idleView } from './table-view';
import type { View } from './table-view';

const card = (rank: number, suit = 0): Card => ({ rank, suit });

/** A quiet table: two cards on the pile, nothing moving, `changes` on top. */
function viewWith(changes: Partial<View>): View {
  return { ...idleView(500, false), pile: [card(1), card(2)], ...changes };
}

const feet: [{ x: number; y: number }, { x: number; y: number }] = [
  { x: -20, y: 10 },
  { x: 20, y: 10 },
];

describe('the card in the air', () => {
  it('is only there while a card is flying', () => {
    expect(cardInAir(viewWith({ flying: null }))).toBeNull();
    expect(cardInAir(viewWith({ flying: 0.5, pile: [] }))).toBeNull();
  });

  it("leaves its flipper's stack face down and lands on the pile face up", () => {
    const start = cardInAir(viewWith({ flying: 0, flipper: 0 }));
    const end = cardInAir(viewWith({ flying: 1, flipper: 0 }));
    expect(start?.card).toEqual(card(2));
    expect(start?.at.gx).toBeCloseTo(-4.4);
    expect(start?.at.gy).toBeCloseTo(4);
    expect(start?.fold).toBeCloseTo(1);
    expect(end?.at.gx).toBeCloseTo(Math.sin(2.3) * 0.5);
    expect(end?.at.gy).toBeCloseTo(Math.cos(1.7) * 0.5);
    expect(end?.fold).toBeCloseTo(1);
    const middle = cardInAir(viewWith({ flying: 0.5, flipper: 1 }));
    expect(middle?.fold).toBeCloseTo(0);
    expect(middle?.z).toBeGreaterThan(start?.z ?? Infinity);
  });
});

describe("the elves' poses", () => {
  it('reaches the playing hand toward the pile', () => {
    const resting = posesOf(viewWith({ reach: [0, 0] }), feet, null);
    const reaching = posesOf(viewWith({ reach: [1, 0] }), feet, null);
    expect(reaching[0].hands[1]).not.toEqual(resting[0].hands[1]);
    expect(reaching[0].hands[0]).toEqual(resting[0].hands[0]);
    expect(reaching[1]).toEqual(resting[1]);
    expect(resting[0].hop).toBe(0);
  });

  it("puts the flipper's hand on the card in the air", () => {
    const view = viewWith({ flying: 0.5, flipper: 1 });
    const flying = posesOf(view, feet, cardInAir(view));
    const still = posesOf(view, feet, null);
    expect(flying[1].hands[1]).not.toEqual(still[1].hands[1]);
    expect(flying[0]).toEqual(still[0]);
  });

  it('raises both hands of a cheering elf, and lowers a sulking one', () => {
    const cheer = posesOf(viewWith({ cheer: { who: 0, progress: 1 / 6 }, sulk: 1 }), feet, null);
    expect(cheer[0].hop).toBeCloseTo(2);
    expect(cheer[0].hands[0].y).toBeLessThan(feet[0].y - 13);
    expect(cheer[0].hands[1].y).toBe(cheer[0].hands[0].y);
    expect(cheer[1].hop).toBe(0);
    expect(cheer[1].hands[0].y).toBeCloseTo(feet[1].y - 3.6 * 1.5);
    expect(cheer[1].hands[1].x).toBeLessThan(feet[1].x);
  });
});
