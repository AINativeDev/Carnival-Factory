import { describe, expect, it } from 'vitest';
import { deal, isSnap, makeDeck, random, RANKS, shuffle, SUITS } from './deck';
import type { Card } from './deck';
import { playUntilSnap } from './rounds';

const key = (card: Card) => `${card.rank}/${card.suit}`;

describe('the deck', () => {
  it('has every card once', () => {
    const deck = makeDeck();
    expect(deck).toHaveLength(RANKS * SUITS);
    expect(new Set(deck.map(key)).size).toBe(RANKS * SUITS);
  });

  it('shuffles the same way for the same seed, and keeps every card', () => {
    const deck = makeDeck();
    expect(shuffle(deck, 7)).toEqual(shuffle(deck, 7));
    expect(shuffle(deck, 7)).not.toEqual(shuffle(deck, 8));
    expect(shuffle(deck, 7).map(key).sort()).toEqual(deck.map(key).sort());
    expect(deck).toEqual(makeDeck());
  });

  it('draws random numbers from 0 to 1', () => {
    const next = random(42);
    for (let i = 0; i < 200; i++) {
      const n = next();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('deals one card at a time, the left elf first', () => {
    const deck = makeDeck();
    const [left, right] = deal(deck);
    expect(left).toHaveLength(deck.length / 2);
    expect(right).toHaveLength(deck.length / 2);
    expect(left[0]).toEqual(deck[0]);
    expect(right[0]).toEqual(deck[1]);
  });
});

describe('snap', () => {
  it('is two cards of the same rank on top of the pile', () => {
    expect(isSnap([{ rank: 3, suit: 0 }])).toBe(false);
    expect(
      isSnap([
        { rank: 3, suit: 0 },
        { rank: 3, suit: 2 },
      ]),
    ).toBe(true);
    expect(
      isSnap([
        { rank: 3, suit: 0 },
        { rank: 4, suit: 0 },
        { rank: 3, suit: 1 },
      ]),
    ).toBe(false);
  });

  it('takes turns until the pile shows a snap', () => {
    const left = [
      { rank: 1, suit: 0 },
      { rank: 4, suit: 0 },
    ];
    const right = [
      { rank: 2, suit: 0 },
      { rank: 4, suit: 1 },
    ];
    const { flips, snapped } = playUntilSnap([left, right], 1);
    expect(snapped).toBe(true);
    expect(flips.map((f) => f.player)).toEqual([1, 0, 1, 0]);
    expect(flips.at(-1)?.card).toEqual({ rank: 4, suit: 0 });
  });

  it('stops without a snap when a hand runs out', () => {
    const { flips, snapped } = playUntilSnap([[{ rank: 1, suit: 0 }], [{ rank: 2, suit: 0 }]], 0);
    expect(snapped).toBe(false);
    expect(flips).toHaveLength(2);
  });
});
