import { describe, expect, it } from 'vitest';
import { onCounter } from './counter';
import { GIFTS, GIFT_SOURCE, installCommand } from './gifts';
import { lookOf } from './parcel';
import { shelfPlace } from './shop';
import {
  BOWS,
  PAPERS,
  REVEAL,
  RIBBONS,
  SHELF,
  START,
  choose,
  giftJustWrapped,
  giftOnCounter,
  revealing,
  settling,
  swatchAt,
  swatchBox,
  tap,
  type Wrapping,
} from './wrapping';

/** A tap in the middle of swatch `n`. */
const middleOf = (n: number) => {
  const box = swatchBox(n);
  return [box.x + box.w / 2, box.y + box.h / 2] as const;
};

/** Wraps one present from `w` with paper, ribbon and bow `picks`, the bow at `time`. */
const wrapOne = (w: Wrapping, picks: readonly [number, number, number], time = 0) =>
  choose(choose(choose(w, picks[0], time), picks[1], time), picks[2], time);

describe('the gift shelf', () => {
  it('holds four to six gifts, each its own skill', () => {
    expect(GIFTS.length).toBeGreaterThanOrEqual(4);
    expect(GIFTS.length).toBeLessThanOrEqual(6);
    expect(new Set(GIFTS.map((g) => g.skill)).size).toBe(GIFTS.length);
  });
});

describe('installCommand', () => {
  it('installs one skill straight from GitHub', () => {
    expect(installCommand('tidy-elf')).toBe(`tessl install ${GIFT_SOURCE} --skill tidy-elf`);
    expect(GIFT_SOURCE.startsWith('github:')).toBe(true);
  });
});

describe('the swatches', () => {
  it('finds each of the four swatches under a tap, and none between or off the card', () => {
    expect([0, 1, 2, 3].map((n) => swatchAt(...middleOf(n)))).toEqual([0, 1, 2, 3]);
    const [x, y] = middleOf(0);
    expect(swatchAt(swatchBox(0).x + swatchBox(0).w + 1, y)).toBe(-1);
    expect(swatchAt(x, 40)).toBe(-1);
  });

  it('has four papers, ribbons and bows to pick from, one for each swatch', () => {
    expect([PAPERS.length, RIBBONS.length, BOWS.length]).toEqual([4, 4, 4]);
  });
});

describe('wrapping a present', () => {
  it('picks the paper, then the ribbon, then the bow, and puts the parcel on the shelf', () => {
    const papered = choose(START, 2, 0);
    expect(papered).toMatchObject({ step: 1, paper: 2 });
    const ribboned = choose(papered, 1, 0);
    expect(ribboned).toMatchObject({ step: 2, paper: 2, ribbon: 1 });
    const done = choose(ribboned, 3, 500);
    expect(done).toMatchObject({ step: 0, wrapped: 1, wrappedAt: 500 });
    expect(done.shelf).toEqual([{ paper: 2, ribbon: 1, bow: 3 }]);
  });

  it('fills the window, then starts a fresh shelf with the next one', () => {
    let w = START;
    for (let n = 0; n < SHELF; n++) w = wrapOne(w, [0, 0, 0]);
    expect(w.shelf).toHaveLength(SHELF);
    w = wrapOne(w, [1, 2, 3]);
    expect(w.shelf).toEqual([{ paper: 1, ribbon: 2, bow: 3 }]);
    expect(w.wrapped).toBe(SHELF + 1);
  });

  it('wraps each of the shop’s gifts in turn', () => {
    expect(giftOnCounter(START)).toBe(GIFTS[0]);
    const once = wrapOne(START, [0, 0, 0]);
    expect(giftOnCounter(once)).toBe(GIFTS[1]);
    expect(giftJustWrapped(once)).toBe(GIFTS[0]);
    let w = START;
    for (let n = 0; n < GIFTS.length; n++) w = wrapOne(w, [0, 0, 0]);
    expect(giftOnCounter(w)).toBe(GIFTS[0]);
  });
});

describe('a tap', () => {
  it('picks the swatch under it, and does nothing off the swatches', () => {
    expect(tap(START, ...middleOf(3), 0)).toMatchObject({ step: 1, paper: 3 });
    expect(tap(START, 50, 30, 0)).toBe(START);
  });

  it('puts the tag away while it shows the gift just wrapped, without picking', () => {
    const done = wrapOne(START, [0, 0, 0], 1000);
    expect(revealing(done, 1000 + REVEAL / 2)).toBe(true);
    const after = tap(done, ...middleOf(1), 1000 + REVEAL / 2);
    expect(after).toMatchObject({ step: 0, paper: -1 });
    expect(revealing(after, 1000 + REVEAL / 2)).toBe(false);
  });

  it('stops showing the tag on its own once its time is up', () => {
    const done = wrapOne(START, [0, 0, 0], 1000);
    expect(revealing(done, 1000 + REVEAL)).toBe(false);
    expect(revealing(START, 0)).toBe(false);
  });
});

describe('the window', () => {
  it('drops the newest parcel into place over half a second', () => {
    const done = wrapOne(START, [0, 0, 0], 1000);
    expect(settling(done, 1000)).toBe(1);
    expect(settling(done, 1250)).toBeCloseTo(0.5);
    expect(settling(done, 2000)).toBe(0);
    expect(settling(START, 0)).toBe(0);
  });

  it('fills the lowest shelf first, four to a shelf, each place its own', () => {
    const places = Array.from({ length: SHELF }, (_, n) => shelfPlace(n));
    expect(new Set(places.map((p) => `${String(p.gx)},${String(p.z)}`)).size).toBe(SHELF);
    expect(places[0]?.z).toBeLessThan(places[4]?.z ?? 0);
    expect(places[4]?.z).toBeLessThan(places[8]?.z ?? 0);
  });

  it('dresses each parcel in the paper, ribbon and bow it was wrapped with', () => {
    expect(lookOf({ paper: 1, ribbon: 2, bow: 3 })).toEqual({
      paper: PAPERS[1],
      ribbon: RIBBONS[2],
      bow: BOWS[3],
    });
  });
});

describe('the counter', () => {
  it('shows plain card, then the paper, then the paper and its ribbon', () => {
    expect(onCounter(START).ribbon).toBeUndefined();
    const papered = choose(START, 2, 0);
    expect(onCounter(papered)).toEqual({ paper: PAPERS[2] });
    expect(onCounter(choose(papered, 1, 0))).toEqual({ paper: PAPERS[2], ribbon: RIBBONS[1] });
  });
});
