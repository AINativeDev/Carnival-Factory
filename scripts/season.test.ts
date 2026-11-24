import { describe, expect, it } from 'vitest';
import { countSeason, EMPTY_SEASON, readSeason, REVIEWER, type RequestRecord } from './season';

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
    const season = { countedAt: AT, participants: { a: { requests: 1, votes: 3 } } };
    expect(readSeason(season).participants.a).toEqual({
      requests: 1,
      shipped: 0,
      findingsFixed: 0,
      votes: 3,
    });
  });

  it('turns anything malformed into an empty season, or drops the bad part', () => {
    expect(readSeason(null)).toEqual(EMPTY_SEASON);
    expect(readSeason({ participants: 'x' })).toEqual(EMPTY_SEASON);
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
