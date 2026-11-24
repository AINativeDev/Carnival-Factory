import { describe, expect, it } from 'vitest';
import {
  deal,
  ease,
  FLIGHT,
  FLIP_TIME,
  flipsAt,
  FLIPS,
  GAME,
  isSnap,
  LOOP,
  makeDeck,
  momentAt,
  playUntilSnap,
  random,
  RANKS,
  roundAt,
  shuffle,
  stacksAt,
  SUITS,
  tally,
} from './booth';
import type { Card } from './booth';

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
    expect(flips.at(-1)!.card).toEqual({ rank: 4, suit: 0 });
  });

  it('stops without a snap when a hand runs out', () => {
    const { flips, snapped } = playUntilSnap([[{ rank: 1, suit: 0 }], [{ rank: 2, suit: 0 }]], 0);
    expect(snapped).toBe(false);
    expect(flips).toHaveLength(2);
  });
});

describe('roundAt', () => {
  it('always ends in a snap on the last flip, with the elves taking turns', () => {
    for (let index = -20; index < 200; index++) {
      const round = roundAt(index);
      expect(round.flips).toHaveLength(FLIPS);
      const pile = round.flips.map((f) => f.card);
      expect(isSnap(pile)).toBe(true);
      for (let n = 2; n < FLIPS; n++) expect(isSnap(pile.slice(0, n))).toBe(false);
      round.flips.forEach((f, n) => expect(f.player).toBe((round.first + n) % 2));
    }
  });

  it('is the same every time, and alternates who starts', () => {
    expect(roundAt(12)).toEqual(roundAt(12));
    expect(roundAt(12).first).toBe(0);
    expect(roundAt(13).first).toBe(1);
  });

  it('lets both elves win rounds', () => {
    const winners = new Set(Array.from({ length: 40 }, (_, i) => roundAt(i).winner));
    expect(winners).toEqual(new Set([0, 1]));
  });
});

describe('tally', () => {
  it('counts the rounds won so far in this game, starting again each game', () => {
    expect(tally(0)).toEqual([0, 0]);
    expect(tally(GAME)).toEqual([0, 0]);
    const [a, b] = tally(GAME - 1, true);
    expect(a + b).toBe(GAME);
    const before = tally(3);
    const after = tally(3, true);
    const gained = roundAt(3).winner === 0 ? [1, 0] : [0, 1];
    expect(after).toEqual([before[0] + gained[0], before[1] + gained[1]]);
  });
});

describe('momentAt', () => {
  it('deals, flips, slaps, cheers, collects and gathers, in that order', () => {
    const stages = [500, 3_000, 7_800, 9_000, 10_500, 11_500].map((t) => momentAt(t).stage);
    expect(stages).toEqual(['deal', 'flip', 'slap', 'cheer', 'collect', 'gather']);
  });

  it('counts rounds, before the page loaded too', () => {
    expect(momentAt(LOOP * 3 + 10).index).toBe(3);
    expect(momentAt(-1).index).toBe(-1);
    expect(momentAt(-1)).toEqual({ ...momentAt(LOOP - 1), index: -1 });
  });

  it('keeps progress between 0 and 1', () => {
    for (let t = 0; t < LOOP; t += 41) {
      const { progress } = momentAt(t);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThan(1);
    }
  });
});

describe('flipsAt', () => {
  it('lands one card after another, each flying for a moment first', () => {
    const start = 1_000;
    expect(flipsAt(momentAt(start + 10))).toEqual({ landed: 0, flying: expect.any(Number) });
    expect(flipsAt(momentAt(start + FLIGHT + 10))).toEqual({ landed: 1, flying: null });
    expect(flipsAt(momentAt(start + FLIP_TIME + 10)).landed).toBe(1);
    expect(flipsAt(momentAt(start + FLIPS * FLIP_TIME - 10)).landed).toBe(FLIPS);
    expect(flipsAt(momentAt(9_000))).toEqual({ landed: FLIPS, flying: null });
    expect(flipsAt(momentAt(100))).toEqual({ landed: 0, flying: null });
  });
});

describe('stacksAt', () => {
  const whole = RANKS * SUITS;
  const count = (t: number) => {
    const moment = momentAt(t);
    const { hands, deck } = stacksAt(moment, roundAt(moment.index));
    return { hands, deck, onTable: hands[0] + hands[1] + deck };
  };

  it('deals the whole deck out, and gathers it back by the end of the round', () => {
    expect(count(0)).toEqual({ hands: [0, 0], deck: whole, onTable: whole });
    expect(count(999).deck).toBeLessThan(2);
    expect(count(LOOP - 1).deck).toBeGreaterThan(whole - 2);
  });

  it('takes each flipped card from its elf, and gives the pile to the winner', () => {
    const round = roundAt(0);
    expect(count(7_800).onTable).toBe(whole - FLIPS);
    const [left, right] = count(11_000).hands;
    expect(round.winner === 0 ? left > right : right > left).toBe(true);
    expect(left + right).toBe(whole);
  });
});

describe('ease', () => {
  it('is slow at both ends and clamped', () => {
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
    expect(ease(0.5)).toBe(0.5);
  });
});
