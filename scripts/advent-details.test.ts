/**
 * The advent challenges' rules at their edges: what parses as a day or a link
 * and what doesn't, exactly what the injection scan is left to read, each
 * reason a request is declined, and which acceptances count.
 */
import { describe, expect, it } from 'vitest';
import {
  acceptMarker,
  ADVENT_MARKER,
  adventCounts,
  adventFreeText,
  decideAdvent,
  parseAdventLink,
  parseDay,
  readAccepted,
  type AdventFacts,
  type AdventRecord,
} from './advent';

describe('parseDay and parseAdventLink', () => {
  it('read a day only when it is the whole answer, with or without a space after Day', () => {
    expect(parseDay('Day5')).toBe(5);
    expect(parseDay('week 5')).toBeUndefined();
    expect(parseDay('5 days')).toBeUndefined();
  });

  it('read a link only when it is the whole answer, over http too', () => {
    expect(parseAdventLink('http://github.com/o/r/pull/1')).toEqual({
      repo: 'o/r',
      kind: 'pull',
      number: 1,
    });
    expect(parseAdventLink('see https://github.com/o/r/pull/1')).toBeUndefined();
    expect(parseAdventLink('https://github.com/o/r/pull/1 please')).toBeUndefined();
  });
});

describe('adventFreeText', () => {
  const form = (day: string, link: string) =>
    `### Which day\n\n${day}\n\n### Your pull request or issue\n\n${link}`;

  it('is the title and body, on plain new lines', () => {
    expect(adventFreeText('T', 'a\rb\r\nc', [])).toBe('T\na\nb\nc');
  });

  it('takes out a day and a link that parse, and nothing else', () => {
    expect(adventFreeText('T', form('Day12', 'https://github.com/o/r/pull/1'), [])).toBe(
      'T\n### Which day\n\n\n\n### Your pull request or issue\n\n',
    );
    expect(adventFreeText('T', form('Day 12', 'undefined'), [])).toBe(
      'T\n### Which day\n\n\n\n### Your pull request or issue\n\nundefined',
    );
  });

  it('keeps a day or a link with words around it', () => {
    const body = form('please 12', 'see my repo');
    expect(adventFreeText('T', body, [])).toBe(`T\n${body}`);
  });
});

describe('decideAdvent’s reasons', () => {
  const facts: AdventFacts = {
    author: 'octocat',
    dayField: 'Day 2',
    linkField: 'https://github.com/octocat/hello/pull/7',
    openedAt: new Date(Date.UTC(2026, 11, 3)),
    year: 2026,
    repo: { fullName: 'octocat/hello', owner: 'octocat' },
    item: { kind: 'pull', number: 7, author: 'octocat' },
  };

  it.each<[Partial<AdventFacts>, object]>([
    [{ flaggedText: true }, { review: true, reason: 'a maintainer will look at this one' }],
    [{ dayField: 'someday' }, { reason: 'the form needs the day, from 1 to 24' }],
    [{ linkField: 'mine' }, { reason: 'the form needs a link to a GitHub pull request or issue' }],
    [
      { item: { kind: 'pull', number: 8, author: 'octocat' } },
      { reason: "that pull request isn't in octocat/hello" },
    ],
    [
      { item: { kind: 'issue', number: 7, author: 'octocat' } },
      { reason: "that pull request isn't in octocat/hello" },
    ],
  ])('declines %o', (change, reason) => {
    expect(decideAdvent({ ...facts, ...change })).toEqual({ check: false, ...reason });
  });
});

describe('readAccepted', () => {
  it('reads every day from 1 to 24, and no other', () => {
    expect(readAccepted(acceptMarker(1))).toBe(1);
    expect(readAccepted(acceptMarker(12))).toBe(12);
    expect(readAccepted(acceptMarker(24))).toBe(24);
    expect(readAccepted(acceptMarker(0))).toBeUndefined();
  });
});

describe('adventCounts', () => {
  const app = { login: 'tessl-app[bot]', type: 'Bot' };
  const comment = (body: string, at: string, user = app) => ({ user, body, created_at: at });
  const accept = (day: number, at: string, user = app) =>
    comment(`${ADVENT_MARKER}\n${acceptMarker(day)}`, at, user);
  const decline = (at: string) => comment(`${ADVENT_MARKER}\nNot this time.`, at);
  const record = (login: string, comments: AdventRecord['comments']): AdventRecord => ({
    issue: { number: 1, user: { login } },
    comments,
  });

  it('goes by the latest decision in time, whatever order the comments come in', () => {
    const later = accept(3, '2026-12-06T00:00:00Z');
    expect(adventCounts([record('ana', [later, decline('2026-12-05T00:00:00Z')])])).toEqual({
      ana: 1,
    });
  });

  it('passes over a later acceptance anyone else wrote, even a user named like the app', () => {
    const lookalike = { login: 'tessl-app[bot]', type: 'User' };
    const forged = accept(3, '2026-12-07T00:00:00Z', lookalike);
    const robot = accept(4, '2026-12-07T00:00:00Z', { login: 'other[bot]', type: 'Bot' });
    for (const late of [forged, robot])
      expect(adventCounts([record('ana', [decline('2026-12-05T00:00:00Z'), late])])).toEqual({});
  });

  it('counts a decision whose marker comes after a blank line', () => {
    const spaced = comment(`\n  ${ADVENT_MARKER}\n${acceptMarker(2)}`, '2026-12-05T00:00:00Z');
    expect(adventCounts([record('ana', [spaced])])).toEqual({ ana: 1 });
  });

  it('lists participants in order of their logins', () => {
    const counts = adventCounts([
      record('zed', [accept(1, '2026-12-05T00:00:00Z')]),
      record('ana', [accept(1, '2026-12-05T00:00:00Z')]),
    ]);
    expect(Object.keys(counts)).toEqual(['ana', 'zed']);
  });
});
