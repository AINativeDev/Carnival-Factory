import { describe, expect, it } from 'vitest';
import {
  boothSpotNumbers,
  landedBooths,
  placePending,
  spotLimit,
  readSpotFile,
  reserveSpots,
  sitesToRemember,
} from './spots';
import type { PendingBooth } from './construction-sites';

const entry = (login: string, issue: number, spot: number): PendingBooth => ({
  login,
  issue,
  spot,
  stage: 'building',
});

describe('readSpotFile', () => {
  it('takes a whole number for the spot, and a positive issue number', () => {
    expect(readSpotFile({ spot: 17 })).toEqual({ spot: 17 });
    expect(readSpotFile({ spot: 17, issue: 80 })).toEqual({ spot: 17, issue: 80 });
    expect(readSpotFile({ spot: 17, issue: -3 })).toEqual({ spot: 17 });
  });

  it('rejects anything else', () => {
    for (const value of [null, 17, '17', {}, { spot: 1.5 }, { spot: -1 }, { spot: '3' }])
      expect(readSpotFile(value)).toBeUndefined();
  });
});

describe('boothSpotNumbers', () => {
  it('puts pins first, then spot.json files, then the rest on the lowest free spots', () => {
    const numbers = boothSpotNumbers(
      ['amy', 'bob', 'cat', 'dan'],
      { bob: 0 },
      { dan: { spot: 2 } },
    );
    expect(Object.fromEntries(numbers)).toEqual({ bob: 0, dan: 2, amy: 1, cat: 3 });
  });

  it('never moves a booth with a pin or a spot.json, whatever booths arrive', () => {
    const files = { cat: { spot: 5 } };
    const before = boothSpotNumbers(['bob', 'cat'], { bob: 0 }, files);
    const after = boothSpotNumbers(['aaron', 'amy', 'bob', 'cat', 'zed'], { bob: 0 }, files);
    expect(after.get('bob')).toBe(before.get('bob'));
    expect(after.get('cat')).toBe(before.get('cat'));
    expect(new Set(after.values()).size).toBe(5);
  });

  it('gives a contested spot to the lower issue number, and the other the next free spot', () => {
    const numbers = boothSpotNumbers(
      ['amy', 'bob'],
      {},
      {
        amy: { spot: 3, issue: 90 },
        bob: { spot: 3, issue: 70 },
      },
    );
    expect(numbers.get('bob')).toBe(3);
    expect(numbers.get('amy')).toBe(0);
  });

  it('gives a contested spot with no issue numbers to the login that sorts first', () => {
    const files = {
      dan: { spot: 3 },
      cat: { spot: 3 },
      amy: { spot: 3 },
      bob: { spot: 5, issue: 9 },
    };
    const numbers = boothSpotNumbers(['dan', 'cat', 'bob', 'amy'], {}, files);
    expect([...numbers]).toEqual([
      ['bob', 5],
      ['amy', 3],
      ['dan', 0],
      ['cat', 1],
    ]);
  });

  it('lets a pin win over a spot.json that claims the same spot', () => {
    const numbers = boothSpotNumbers(['amy', 'bob'], { bob: 4 }, { amy: { spot: 4, issue: 1 } });
    expect(numbers.get('bob')).toBe(4);
    expect(numbers.get('amy')).toBe(0);
  });

  it('ignores an invalid spot.json', () => {
    const numbers = boothSpotNumbers(['amy'], {}, { amy: { spot: -2 } });
    expect(numbers.get('amy')).toBe(0);
  });

  it('puts a spot.json claim past the spot limit on the next free spot', () => {
    const numbers = boothSpotNumbers(['amy', 'bob'], {}, { bob: { spot: 9999, issue: 1 } });
    expect(numbers.get('bob')).toBe(1);
    expect(boothSpotNumbers(['amy'], {}, { amy: { spot: spotLimit(1) - 1 } }).get('amy')).toBe(
      spotLimit(1) - 1,
    );
  });
});

describe('reserveSpots', () => {
  it('holds the next free spots after every taken one, in order of issue number', () => {
    const reserved = reserveSpots(
      [
        { login: 'zed', issue: 90 },
        { login: 'amy', issue: 12 },
      ],
      [0, 1, 3],
    );
    expect(Object.fromEntries(reserved)).toEqual({ amy: 2, zed: 4 });
  });

  it('is deterministic, and never gives two requests the same spot', () => {
    const requests = Array.from({ length: 20 }, (_, n) => ({ login: `elf-${n}`, issue: 100 - n }));
    const a = reserveSpots(requests, [0, 2, 4]);
    const b = reserveSpots([...requests].reverse(), [4, 2, 0]);
    expect([...a].sort()).toEqual([...b].sort());
    expect(new Set(a.values()).size).toBe(20);
  });

  it('holds one spot for someone with two open requests, by their first', () => {
    const reserved = reserveSpots(
      [
        { login: 'amy', issue: 30 },
        { login: 'amy', issue: 12 },
      ],
      [0],
    );
    expect(Object.fromEntries(reserved)).toEqual({ amy: 1 });
  });
});

describe('placePending', () => {
  it('shows a request from someone with a booth as an update, on that booth', () => {
    const { sites, updates } = placePending([entry('amy', 5, 0)], new Map([['amy', 0]]));
    expect([...updates]).toEqual(['amy']);
    expect(sites.size).toBe(0);
  });

  it('puts a construction site on the spot held for it', () => {
    const { sites } = placePending([entry('bob', 5, 7)], new Map([['amy', 0]]));
    expect(sites.get('bob')).toBe(7);
  });

  it('moves a site whose spot a booth took meanwhile to the next free spot', () => {
    const { sites } = placePending(
      [entry('bob', 5, 1), entry('cat', 6, 2)],
      new Map([
        ['amy', 0],
        ['dan', 1],
      ]),
    );
    expect(sites.get('cat')).toBe(2);
    expect(sites.get('bob')).toBe(3);
  });

  it('moves a site past the spot limit to the next free spot', () => {
    const { sites } = placePending([entry('bob', 5, 9999)], new Map([['amy', 0]]));
    expect(sites.get('bob')).toBe(1);
  });

  it('puts one site up for someone with two requests, on the spot their first held', () => {
    const { sites } = placePending([entry('bob', 9, 4), entry('bob', 5, 7)], new Map([['amy', 0]]));
    expect([...sites]).toEqual([['bob', 7]]);
  });
});

describe('landedBooths', () => {
  it('names the construction sites that are booths now, once each', () => {
    expect(landedBooths(['amy', 'bob', 'amy'], new Set(['amy', 'cat']))).toEqual(['amy']);
  });
});

describe('sitesToRemember', () => {
  it('keeps the sites up now, and remembered ones that are not booths here yet', () => {
    expect(sitesToRemember(['amy', 'bob', 'cat'], ['dan', 'cat'], new Set(['amy']))).toEqual([
      'dan',
      'cat',
      'bob',
    ]);
  });
});
