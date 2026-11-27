/**
 * The finer points of every square's history: titles capped, the order of
 * squares and pull requests, decisions from what was built, and the states and
 * previews of pull requests.
 */
import { describe, expect, it } from 'vitest';
import type { RawIssue, RawPull } from './github-requests.ts';
import { cap, shapeHistory, type SquareHistory } from './square-history.ts';
import { issue, pull } from './test-support/github-requests.ts';

const BOOTH = 'carnival/booths/ana/booth.ts';
const shape = (issues: RawIssue[], pulls: RawPull[], site?: string) =>
  shapeHistory({
    squares: ['booth/ana', 'attraction/ferris-wheel', 'booth/ghost', 'booth/aaron'],
    issues,
    pulls,
    ...(site === undefined ? {} : { site }),
    builtAt: '2026-11-24T16:00:00Z',
  });
const at = '2026-11-20T10:00:00Z';
/** A square's history, or none: the index access may miss. */
const entriesOn = (history: SquareHistory, square: string) =>
  Object.entries(history.squares).find(([key]) => key === square)?.[1] ?? [];

describe('cap', () => {
  it('trims the ends, and keeps text exactly at the limit whole', () => {
    expect(cap('  a  b  ')).toBe('a b');
    expect(cap('abcd', 4)).toBe('abcd');
  });
});

describe('shapeHistory', () => {
  it('lists a request’s pull requests newest first, and its squares in order', () => {
    const history = shape(
      [issue(1, 'maintainer', ['tessl'], at)],
      [
        pull(2, 'tessl/issue-1', [BOOTH]),
        pull(3, 'tessl/issue-1', [BOOTH, 'carnival/attractions/ferris-wheel/a.ts']),
      ],
    );
    expect(Object.keys(history.squares)).toEqual(['attraction/ferris-wheel', 'booth/ana']);
    expect(
      entriesOn(history, 'booth/ana')
        .at(0)
        ?.pulls.map((p) => p.number),
    ).toEqual([3, 2]);
  });

  it('files a request under its squares in order, its author’s own among them', () => {
    const history = shape(
      [issue(1, 'aaron', ['booth-request'], at)],
      [pull(2, 'tessl/issue-1', [BOOTH])],
    );
    expect(Object.keys(history.squares)).toEqual(['booth/aaron', 'booth/ana']);
  });

  it('counts a request as accepted once something was built for it, and waiting before', () => {
    const decision = (pulls: RawPull[]) =>
      entriesOn(shape([issue(1, 'ana', ['booth-request'], at)], pulls), 'booth/ana').at(0)
        ?.decision;
    expect(decision([pull(2, 'tessl/issue-1', [BOOTH])])).toBe('accepted');
    expect(decision([])).toBe('waiting');
  });

  it('puts a deleted account’s booth request on the ghost’s booth', () => {
    const gone = { ...issue(1, 'x', ['booth-request'], at), author: null };
    expect(entriesOn(shape([gone], []), 'booth/ghost').at(0)?.author).toBe('ghost');
  });

  it('credits only the squares something merged into', () => {
    const history = shape(
      [issue(1, 'maintainer', ['tessl'], at)],
      [pull(2, 'tessl/issue-1', ['carnival/attractions/ferris-wheel/a.ts'], { state: 'CLOSED' })],
    );
    expect(Object.keys(history.credits)).toEqual([]);
  });

  it('says whether a pull request merged, is open or closed, and previews only an open one', () => {
    const site = 'https://o.github.io/r/';
    const history = shape(
      [issue(1, 'ana', ['booth-request', 'tessl'], at)],
      [
        pull(2, 'tessl/issue-1', [BOOTH]),
        pull(3, 'tessl/issue-1', [BOOTH], { state: 'CLOSED', mergedAt: null }),
        pull(4, 'tessl/issue-1', [BOOTH], { state: 'OPEN', mergedAt: null }),
      ],
      site,
    );
    const states = entriesOn(history, 'booth/ana')
      .at(0)
      ?.pulls.map((p) => [p.number, p.state, p.preview]);
    expect(states).toEqual([
      [4, 'open', `${site}previews/pr-4/#/booth/ana`],
      [3, 'closed', undefined],
      [2, 'merged', undefined],
    ]);
  });
});
