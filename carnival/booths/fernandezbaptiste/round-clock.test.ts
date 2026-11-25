import { describe, expect, it } from 'vitest';
import { RANKS, SUITS } from './deck';
import { ease, FLIGHT, FLIP_TIME, flipsAt, LOOP, momentAt, stacksAt } from './round-clock';
import { FLIPS, roundAt } from './rounds';

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
    const first = flipsAt(momentAt(start + 10));
    expect(first.landed).toBe(0);
    expect(first.flying).toBeTypeOf('number');
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
