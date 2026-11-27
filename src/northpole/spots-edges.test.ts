import { describe, expect, it } from 'vitest';
import type { PendingBooth } from './construction-sites';
import { boothSpotNumbers, placePending, readSpotFile, sitesToRemember, spotLimit } from './spots';

/**
 * The spots' rules at their edges: the last spot a claim may take, the
 * smallest issue number, and files and pins that don't count.
 */
const entry = (login: string, issue: number, spot: number): PendingBooth => ({
  login,
  issue,
  spot,
  stage: 'building',
});

describe("a booth's spot.json, at the edges", () => {
  it('takes issue 1 and a spot of 0, and leaves out an issue that is not a whole number', () => {
    expect(readSpotFile({ spot: 0, issue: 1 })).toEqual({ spot: 0, issue: 1 });
    expect(readSpotFile(Object.assign(() => 0, { spot: 3 }))).toBeUndefined();
    for (const issue of [0, 1.5, '5', null])
      expect(readSpotFile({ spot: 3, issue })).toEqual({ spot: 3 });
  });
});

describe('boothSpotNumbers, at the edges', () => {
  it('holds the island to a hundred spots past its booths', () => {
    expect(spotLimit(3)).toBe(103);
  });

  it('turns down a claim on the spot limit itself', () => {
    expect(boothSpotNumbers(['amy'], {}, { amy: { spot: spotLimit(1) } }).get('amy')).toBe(0);
  });

  it('gives a pin to the first booth pinned to it, and the next booth the next free spot', () => {
    expect(Object.fromEntries(boothSpotNumbers(['amy', 'bob'], { amy: 2, bob: 2 }))).toEqual({
      amy: 2,
      bob: 0,
    });
    expect(boothSpotNumbers(['amy'], { amy: -1 }).get('amy')).toBe(0);
  });

  it('keeps a pinned booth on its pin, whatever its spot.json says', () => {
    const numbers = boothSpotNumbers(['amy', 'bob'], { amy: 0 }, { amy: { spot: 1, issue: 1 } });
    expect(Object.fromEntries(numbers)).toEqual({ amy: 0, bob: 1 });
  });

  it("reads only a booth's own spot.json, never one the files inherit", () => {
    const files = Object.create({ amy: { spot: 3 } }) as Record<string, { spot: number }>;
    expect(boothSpotNumbers(['amy'], {}, files).get('amy')).toBe(0);
  });

  it('skips a spot.json that is not valid, even with an issue number', () => {
    const files = { amy: { spot: 1.5, issue: 1 }, bob: { spot: 1 } };
    expect(Object.fromEntries(boothSpotNumbers(['amy', 'bob'], {}, files))).toEqual({
      bob: 1,
      amy: 0,
    });
  });

  it('gives a spot claimed with no issue numbers to the login that sorts first, whatever the order', () => {
    const files = { amy: { spot: 3 }, bob: { spot: 3 }, cat: { spot: 3 } };
    expect(boothSpotNumbers(['amy', 'cat', 'bob'], {}, files).get('amy')).toBe(3);
    expect(boothSpotNumbers(['cat', 'amy', 'bob'], {}, files).get('amy')).toBe(3);
  });

  it('puts a claim with an issue number before claims without one', () => {
    const files = { amy: { spot: 2 }, bob: { spot: 2, issue: 500 } };
    expect(boothSpotNumbers(['amy', 'bob'], {}, files).get('bob')).toBe(2);
  });
});

describe('placePending, at the edges', () => {
  it('moves a site held on the spot limit itself to the next free spot', () => {
    const booths = new Map([['amy', 0]]);
    expect(placePending([entry('bob', 5, spotLimit(1))], booths).sites.get('bob')).toBe(1);
    expect(placePending([entry('bob', 5, spotLimit(1) - 1)], booths).sites.get('bob')).toBe(
      spotLimit(1) - 1,
    );
  });

  it('shows a second request from someone with a booth as one update, and no site', () => {
    const { sites, updates } = placePending(
      [entry('amy', 9, 4), entry('amy', 5, 3)],
      new Map([['amy', 0]]),
    );
    expect([...updates]).toEqual(['amy']);
    expect(sites.size).toBe(0);
  });

  it('gives two sites held on one spot to the lower issue, and moves the other', () => {
    const { sites } = placePending([entry('cat', 9, 2), entry('bob', 5, 2)], new Map([['amy', 0]]));
    expect(Object.fromEntries(sites)).toEqual({ bob: 2, cat: 1 });
  });
});

describe('sitesToRemember, at the edges', () => {
  it('remembers a site once, however often it was remembered', () => {
    expect(sitesToRemember(['bob', 'bob'], [], new Set())).toEqual(['bob']);
  });
});
