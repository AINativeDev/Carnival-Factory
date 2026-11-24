import { describe, expect, it } from 'vitest';
import {
  branchIssue,
  cap,
  countFindings,
  creditsOf,
  decisionOf,
  shapeHistory,
  squaresTouched,
  type RawIssue,
  type RawPull,
} from './square-history.ts';

const REPO = 'https://github.com/o/r';

const issue = (number: number, login: string, labels: string[], createdAt: string): RawIssue => ({
  number,
  title: `Request ${number}`,
  url: `${REPO}/issues/${number}`,
  createdAt,
  author: { login },
  labels: { nodes: labels.map((name) => ({ name })) },
});

const thread = (login: string, isResolved: boolean) => ({
  isResolved,
  comments: { nodes: [{ author: { login } }] },
});

const pull = (
  number: number,
  branch: string,
  paths: string[],
  extra: Partial<RawPull> = {},
): RawPull => ({
  number,
  url: `${REPO}/pull/${number}`,
  state: 'MERGED',
  mergedAt: '2026-11-24T15:18:46Z',
  headRefName: branch,
  isCrossRepository: false,
  commits: { totalCount: 3 },
  files: { nodes: paths.map((path) => ({ path })) },
  reviewThreads: { nodes: [] },
  ...extra,
});

describe('squaresTouched', () => {
  it('finds the booths and attractions a change touches, once each', () => {
    expect(
      squaresTouched([
        'booths/Ana/booth.ts',
        'booths/ana/README.md',
        'attractions/ferris-wheel/attraction.ts',
        'northpole/map.ts',
        'booths/README.md',
      ]),
    ).toEqual(['attraction/ferris-wheel', 'booth/ana']);
  });
});

describe('branchIssue', () => {
  it('reads the issue from a factory branch, and nothing from any other', () => {
    expect(branchIssue('tessl/issue-76')).toBe(76);
    expect(branchIssue('answer-by-reply')).toBeUndefined();
    expect(branchIssue('tessl/issue-76-copy')).toBeUndefined();
  });
});

describe('decisionOf', () => {
  it('tells what the assessment decided', () => {
    expect(decisionOf(['booth-request', 'declined'], false)).toBe('declined');
    expect(decisionOf(['booth-request', 'needs-info'], false)).toBe('question');
    expect(decisionOf(['booth-request', 'tessl'], false)).toBe('accepted');
    expect(decisionOf([], true)).toBe('accepted');
    expect(decisionOf(['booth-request'], false)).toBe('waiting');
  });
});

describe('countFindings', () => {
  it("counts the reviewer's threads, and the resolved ones as fixed", () => {
    const pr = pull(1, 'tessl/issue-1', [], {
      reviewThreads: {
        nodes: [
          thread('tessl-reviewer', true),
          thread('tessl-reviewer[bot]', false),
          thread('someone', true),
        ],
      },
    });
    expect(countFindings(pr)).toEqual({ findings: 2, fixed: 1 });
  });
});

describe('cap', () => {
  it('keeps a title to one line and a set length', () => {
    expect(cap('a\n  b')).toBe('a b');
    expect(cap('abcdef', 4)).toBe('abc…');
  });
});

describe('shapeHistory', () => {
  const shape = (issues: RawIssue[], pulls: RawPull[], site?: string) =>
    shapeHistory({
      squares: ['booth/ana', 'attraction/ferris-wheel'],
      issues,
      pulls,
      site,
      builtAt: '2026-11-24T16:00:00Z',
    });

  it('puts each request on the squares its factory pull requests change, newest first', () => {
    const history = shape(
      [
        issue(1, 'Ana', ['booth-request', 'tessl'], '2026-11-20T10:00:00Z'),
        issue(5, 'maintainer', ['tessl'], '2026-11-22T10:00:00Z'),
      ],
      [
        pull(2, 'tessl/issue-1', ['booths/ana/booth.ts'], {
          reviewThreads: { nodes: [thread('tessl-reviewer', true)] },
        }),
        pull(6, 'tessl/issue-5', ['attractions/ferris-wheel/attraction.ts', 'booths/ana/booth.ts']),
      ],
    );
    expect(history.squares['booth/ana'].map((entry) => entry.issue)).toEqual([5, 1]);
    expect(history.squares['attraction/ferris-wheel'].map((entry) => entry.issue)).toEqual([5]);
    expect(history.squares['booth/ana'][1]).toEqual({
      issue: 1,
      title: 'Request 1',
      url: `${REPO}/issues/1`,
      author: 'Ana',
      openedAt: '2026-11-20T10:00:00Z',
      decision: 'accepted',
      pulls: [
        {
          number: 2,
          url: `${REPO}/pull/2`,
          state: 'merged',
          findings: 1,
          fixed: 1,
          commits: 3,
          mergedAt: '2026-11-24T15:18:46Z',
        },
      ],
    });
  });

  it('lists on each square only the pull requests that changed it', () => {
    const history = shape(
      [issue(5, 'ana', ['booth-request', 'tessl'], '2026-11-22T10:00:00Z')],
      [
        pull(6, 'tessl/issue-5', ['attractions/ferris-wheel/attraction.ts'], { state: 'CLOSED' }),
        pull(7, 'tessl/issue-5', ['booths/ana/booth.ts']),
      ],
    );
    expect(history.squares['attraction/ferris-wheel'][0].pulls.map((p) => p.number)).toEqual([6]);
    expect(history.squares['booth/ana'][0].pulls.map((p) => p.number)).toEqual([7]);
  });

  it("shows a booth request that wasn't built on its author's booth", () => {
    const history = shape(
      [
        issue(3, 'ana', ['booth-request', 'declined'], '2026-11-21T10:00:00Z'),
        issue(4, 'ana', ['booth-request', 'needs-info'], '2026-11-21T11:00:00Z'),
      ],
      [],
    );
    expect(history.squares['booth/ana'].map((e) => [e.issue, e.decision, e.pulls])).toEqual([
      [4, 'question', []],
      [3, 'declined', []],
    ]);
  });

  it('leaves out squares not on the map, other branches, forks and issues that shaped no square', () => {
    const history = shape(
      [
        issue(1, 'bob', ['booth-request', 'declined'], '2026-11-20T10:00:00Z'),
        issue(2, 'maintainer', ['tessl'], '2026-11-20T10:00:00Z'),
        issue(3, 'maintainer', [], '2026-11-20T10:00:00Z'),
      ],
      [
        pull(10, 'tessl/issue-2', ['northpole/map.ts']),
        pull(11, 'some-branch', ['booths/ana/booth.ts']),
        pull(12, 'tessl/issue-3', ['booths/ana/booth.ts'], { isCrossRepository: true }),
      ],
    );
    expect(history.squares).toEqual({});
    expect(history.credits).toEqual({});
  });

  it('credits who made each square and who improved it, from the requests that merged', () => {
    const at = (day: number) => `2026-11-${day}T10:00:00Z`;
    const history = shape(
      [
        issue(1, 'Ana', ['booth-request', 'tessl'], at(10)),
        issue(3, 'maintainer', ['tessl'], at(11)),
        issue(5, 'bob', ['tessl'], at(12)),
        issue(7, 'carol', ['tessl'], at(13)),
      ],
      [
        pull(2, 'tessl/issue-1', ['booths/ana/booth.ts'], { mergedAt: at(14) }),
        pull(4, 'tessl/issue-3', ['booths/ana/booth.ts', 'attractions/ferris-wheel/a.ts'], {
          mergedAt: at(15),
        }),
        pull(6, 'tessl/issue-5', ['booths/ana/booth.ts'], { mergedAt: at(16) }),
        pull(8, 'tessl/issue-7', ['booths/ana/booth.ts'], { state: 'OPEN', mergedAt: null }),
      ],
    );
    expect(history.credits).toEqual({
      'booth/ana': { maker: 'Ana', improvers: ['maintainer', 'bob'] },
      'attraction/ferris-wheel': { improvers: ['maintainer'] },
    });
  });

  it("links an open pull request's preview of the square, when the site is known", () => {
    const history = shape(
      [issue(1, 'ana', ['booth-request', 'tessl'], '2026-11-20T10:00:00Z')],
      [pull(2, 'tessl/issue-1', ['booths/ana/booth.ts'], { state: 'OPEN', mergedAt: null })],
      'https://o.github.io/r/',
    );
    expect(history.squares['booth/ana'][0].pulls[0]).toMatchObject({
      state: 'open',
      preview: 'https://o.github.io/r/previews/pr-2/#/booth/ana',
    });
    expect(history.squares['booth/ana'][0].pulls[0].mergedAt).toBeUndefined();
  });
});

describe('creditsOf', () => {
  const entry = (author: string, pulls: { state: 'merged' | 'open'; mergedAt?: string }[]) => ({
    issue: 1,
    title: 'Request',
    url: `${REPO}/issues/1`,
    author,
    openedAt: '2026-11-01T10:00:00Z',
    decision: 'accepted' as const,
    pulls: pulls.map((p, n) => ({ number: n, url: '', findings: 0, fixed: 0, commits: 1, ...p })),
  });

  it('orders people by when their change first merged, and names each once', () => {
    expect(
      creditsOf('attraction/ferris-wheel', [
        entry('bob', [{ state: 'merged', mergedAt: '2026-11-03T00:00:00Z' }]),
        entry('ana', [{ state: 'merged', mergedAt: '2026-11-02T00:00:00Z' }]),
        entry('Bob', [{ state: 'merged', mergedAt: '2026-11-05T00:00:00Z' }]),
        entry('ANA', [{ state: 'merged', mergedAt: '2026-11-04T00:00:00Z' }]),
      ]),
    ).toEqual({ improvers: ['ana', 'bob'] });
  });

  it("makes a booth's owner its maker, even when someone else's change merged first", () => {
    const merged = (author: string, day: number) =>
      entry(author, [{ state: 'merged', mergedAt: `2026-11-0${day}T00:00:00Z` }]);
    expect(creditsOf('booth/ana', [merged('maintainer', 1), merged('Ana', 2)])).toEqual({
      maker: 'Ana',
      improvers: ['maintainer'],
    });
    expect(creditsOf('booth/ana', [merged('maintainer', 1)])).toEqual({
      maker: 'ana',
      improvers: ['maintainer'],
    });
  });

  it('credits nobody for requests that never merged, but a booth still has its owner', () => {
    const none = [entry('ana', [{ state: 'open' }]), entry('bob', [])];
    expect(creditsOf('attraction/ferris-wheel', none)).toBeUndefined();
    expect(creditsOf('booth/bob', none)).toEqual({ maker: 'bob', improvers: [] });
  });
});
