import { describe, expect, it } from 'vitest';
import {
  countSeason,
  EMPTY_SEASON,
  readSeason,
  REVIEWER,
  seasonStats,
  type RequestRecord,
} from './season';

const AT = '2026-12-01T00:00:00.000Z';
const thread = (resolved: boolean, author: string | null = REVIEWER) => ({ resolved, author });

describe('countSeason', () => {
  it('counts requests made, requests shipped and the review findings fixed', () => {
    const requests: RequestRecord[] = [
      {
        author: 'Sjmaple',
        pulls: [{ number: 10, merged: true, threads: [thread(true), thread(true), thread(false)] }],
      },
      { author: 'sjmaple', pulls: [] },
      { author: 'sjmaple', pulls: [{ number: 11, merged: false, threads: [thread(true)] }] },
    ];
    expect(countSeason(requests, AT)).toEqual({
      countedAt: AT,
      participants: { sjmaple: { requests: 3, shipped: 1, findingsFixed: 2 } },
    });
  });

  it("counts only the reviewer's findings, not a person's threads", () => {
    const requests: RequestRecord[] = [
      {
        author: 'pstember',
        pulls: [{ number: 5, merged: true, threads: [thread(true, 'someone'), thread(true)] }],
      },
    ];
    expect(countSeason(requests, AT).participants.pstember.findingsFixed).toBe(1);
  });

  it("counts the reviewer's findings under its bot login too", () => {
    const requests: RequestRecord[] = [
      {
        author: 'pstember',
        pulls: [
          {
            number: 5,
            merged: true,
            threads: [
              thread(true, `${REVIEWER}[bot]`),
              thread(true),
              thread(true, 'someone[bot]'),
              thread(true, `[bot]${REVIEWER}`),
              thread(true, null),
            ],
          },
        ],
      },
    ];
    expect(countSeason(requests, AT).participants.pstember.findingsFixed).toBe(2);
  });

  it('counts a pull request that closed two requests once', () => {
    const pull = { number: 7, merged: true, threads: [thread(true)] };
    const requests: RequestRecord[] = [
      { author: 'chandler767', pulls: [pull] },
      { author: 'chandler767', pulls: [pull] },
    ];
    expect(countSeason(requests, AT).participants.chandler767).toEqual({
      requests: 2,
      shipped: 2,
      findingsFixed: 1,
    });
  });

  it("counts a pull request that closed two participants' requests for each of them", () => {
    const pull = { number: 8, merged: true, threads: [thread(true), thread(true)] };
    const requests: RequestRecord[] = [
      { author: 'alice', pulls: [pull] },
      { author: 'bob', pulls: [pull] },
    ];
    const both = { requests: 1, shipped: 1, findingsFixed: 2 };
    expect(countSeason(requests, AT).participants).toEqual({ alice: both, bob: both });
    expect(countSeason([...requests].reverse(), AT).participants).toEqual({
      alice: both,
      bob: both,
    });
  });

  it('counts a login that is also an inherited property name', () => {
    const requests: RequestRecord[] = [
      { author: 'constructor', pulls: [{ number: 9, merged: true, threads: [thread(true)] }] },
      { author: 'toString', pulls: [] },
    ];
    expect(countSeason(requests, AT).participants).toEqual({
      constructor: { requests: 1, shipped: 1, findingsFixed: 1 },
      tostring: { requests: 1, shipped: 0, findingsFixed: 0 },
    });
  });

  it('skips a request whose author is gone', () => {
    expect(countSeason([{ author: null, pulls: [] }], AT).participants).toEqual({});
  });
});

describe('readSeason', () => {
  it('reads back what countSeason wrote', () => {
    const season = countSeason([{ author: 'jedi4ever', pulls: [] }], AT);
    expect(readSeason(JSON.parse(JSON.stringify(season)))).toEqual(season);
  });

  it('keeps the optional numbers once they have a source', () => {
    const season = {
      countedAt: AT,
      participants: { a: { requests: 1, votes: 3, featured: 2, advent: -1 } },
    };
    expect(readSeason(season).participants.a).toEqual({
      requests: 1,
      shipped: 0,
      findingsFixed: 0,
      votes: 3,
      featured: 2,
      advent: 0,
    });
  });

  it('turns anything malformed into an empty season, or drops the bad part', () => {
    expect(readSeason(null)).toEqual(EMPTY_SEASON);
    expect(readSeason({ participants: 'x' })).toEqual(EMPTY_SEASON);
    for (const value of [undefined, 5, 'text']) expect(readSeason(value)).toEqual(EMPTY_SEASON);
    for (const participants of ['x', null])
      expect(readSeason({ countedAt: AT, participants })).toEqual(EMPTY_SEASON);
    const odd = { 'a<b': {}, '<b>a': {}, five: 5, gone: null, ok: {} };
    expect(Object.keys(readSeason({ participants: odd }).participants)).toEqual(['ok']);
    const season = readSeason({
      countedAt: 3,
      participants: { '<b>': { requests: 1 }, ok: { requests: -1, shipped: 1.5 } },
    });
    expect(season).toEqual({
      countedAt: null,
      participants: { ok: { requests: 0, shipped: 0, findingsFixed: 0 } },
    });
  });
});

describe('seasonStats', () => {
  it("finds a participant's counts, and none for an inherited property name", () => {
    const season = countSeason([{ author: 'constructor', pulls: [] }], AT);
    expect(seasonStats(season, 'constructor')).toEqual({
      requests: 1,
      shipped: 0,
      findingsFixed: 0,
    });
    expect(seasonStats(season, 'hasownproperty')).toBeUndefined();
    expect(seasonStats(EMPTY_SEASON, 'constructor')).toBeUndefined();
  });
});
