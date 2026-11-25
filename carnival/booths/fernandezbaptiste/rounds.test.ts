import { describe, expect, it } from 'vitest';
import { isSnap } from './deck';
import { FLIPS, GAME, roundAt, tally } from './rounds';

describe('roundAt', () => {
  it('always ends in a snap on the last flip, with the elves taking turns', () => {
    for (let index = -20; index < 200; index++) {
      const round = roundAt(index);
      expect(round.flips).toHaveLength(FLIPS);
      const pile = round.flips.map((f) => f.card);
      expect(isSnap(pile)).toBe(true);
      for (let n = 2; n < FLIPS; n++) expect(isSnap(pile.slice(0, n))).toBe(false);
      round.flips.forEach((f, n) => {
        expect(f.player).toBe((round.first + n) % 2);
      });
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
    const gained: [number, number] = roundAt(3).winner === 0 ? [1, 0] : [0, 1];
    expect(after).toEqual([before[0] + gained[0], before[1] + gained[1]]);
  });
});
