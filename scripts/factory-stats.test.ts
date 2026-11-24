import { describe, expect, it } from 'vitest';
import { factoryStats, labelledAt, median, minutesToMap } from './factory-stats.ts';
import type { RawIssue, RawPull } from './square-history.ts';

const REPO = 'https://github.com/o/r';

const issue = (
  number: number,
  labels: string[],
  labelled: [string, string][] = [],
  title = `Request ${number}`,
): RawIssue => ({
  number,
  title,
  url: `${REPO}/issues/${number}`,
  createdAt: '2026-11-20T09:00:00Z',
  author: { login: `person${number}` },
  labels: { nodes: labels.map((name) => ({ name })) },
  timelineItems: {
    nodes: labelled.map(([name, createdAt]) => ({ createdAt, label: { name } })),
  },
});

const thread = (login: string, isResolved: boolean) => ({
  isResolved,
  comments: { nodes: [{ author: { login } }] },
});

const pull = (number: number, branch: string, extra: Partial<RawPull> = {}): RawPull => ({
  number,
  url: `${REPO}/pull/${number}`,
  state: 'MERGED',
  mergedAt: '2026-11-20T10:00:00Z',
  headRefName: branch,
  isCrossRepository: false,
  labels: { nodes: [] },
  commits: { totalCount: 2 },
  files: { nodes: [] },
  reviewThreads: { nodes: [] },
  ...extra,
});

describe('labelledAt', () => {
  it('finds when an issue first got a label', () => {
    const request = issue(
      1,
      ['tessl'],
      [
        ['booth-request', '2026-11-20T09:00:00Z'],
        ['tessl', '2026-11-21T09:00:00Z'],
        ['tessl', '2026-11-20T09:30:00Z'],
      ],
    );
    expect(labelledAt(request)).toBe('2026-11-20T09:30:00Z');
    expect(labelledAt(request, 'declined')).toBeUndefined();
    expect(labelledAt({ ...request, timelineItems: undefined })).toBeUndefined();
  });
});

describe('median', () => {
  it('takes the middle value, or the mean of the middle two', () => {
    expect(median([30, 5, 12])).toBe(12);
    expect(median([40, 10, 20, 30])).toBe(25);
  });
});

describe('minutesToMap', () => {
  it('times booth requests from acceptance to their first merge after it, and skips the rest', () => {
    const minutes = minutesToMap(
      [
        issue(1, ['booth-request', 'tessl'], [['tessl', '2026-11-20T09:00:00Z']]),
        // Merged twice: the first merge after acceptance counts.
        issue(2, ['booth-request', 'tessl'], [['tessl', '2026-11-20T09:00:00Z']]),
        // Not a booth request.
        issue(3, ['tessl'], [['tessl', '2026-11-20T09:00:00Z']]),
        // Never accepted.
        issue(4, ['booth-request']),
        // Accepted, not merged.
        issue(5, ['booth-request', 'tessl'], [['tessl', '2026-11-20T09:00:00Z']]),
      ],
      [
        pull(10, 'tessl/issue-1', { mergedAt: '2026-11-20T09:42:20Z' }),
        pull(11, 'tessl/issue-2', { mergedAt: '2026-11-20T11:00:00Z' }),
        pull(12, 'tessl/issue-2', { mergedAt: '2026-11-20T09:15:00Z' }),
        pull(13, 'tessl/issue-3', { mergedAt: '2026-11-20T09:05:00Z' }),
        pull(14, 'tessl/issue-4'),
        pull(15, 'tessl/issue-5', { state: 'OPEN', mergedAt: null }),
        pull(16, 'tessl/issue-5', { isCrossRepository: true }),
      ],
    );
    expect(minutes.sort((a, b) => a - b)).toEqual([15, 42]);
  });
});

describe('factoryStats', () => {
  const issues = [
    issue(1, ['booth-request', 'tessl'], [['tessl', '2026-11-20T09:00:00Z']]),
    issue(2, ['booth-request', 'tessl'], [['tessl', '2026-11-20T09:00:00Z']]),
    issue(3, ['booth-request', 'tessl'], [['tessl', '2026-11-20T09:00:00Z']]),
    issue(4, ['booth-request', 'needs-info']),
    issue(5, ['booth-request', 'declined']),
    issue(6, ['booth-request']),
    issue(7, ['tessl'], [['tessl', '2026-11-20T09:00:00Z']]),
  ];
  const pulls = [
    pull(10, 'tessl/issue-1', {
      mergedAt: '2026-11-20T09:10:00Z',
      labels: { nodes: [{ name: 'auto-merged' }] },
      reviewThreads: {
        nodes: [thread('tessl-reviewer', true), thread('tessl-reviewer[bot]', false)],
      },
    }),
    pull(11, 'tessl/issue-2', {
      mergedAt: '2026-11-20T09:30:00Z',
      labels: { nodes: [{ name: 'auto-merged' }] },
    }),
    pull(12, 'tessl/issue-3', {
      mergedAt: '2026-11-20T11:00:00Z',
      reviewThreads: { nodes: [thread('tessl-reviewer', true), thread('someone', false)] },
    }),
    pull(13, 'tessl/issue-7', { state: 'OPEN', mergedAt: null }),
    pull(14, 'tessl/faster-builds', { state: 'CLOSED', mergedAt: null }),
    // Not the factory's: another branch, and a fork's branch.
    pull(15, 'faster-builds'),
    pull(16, 'tessl/issue-6', { isCrossRepository: true }),
  ];

  it("counts the factory's builds, the requests, the findings and the time to the map", () => {
    expect(factoryStats(issues, pulls, '2026-11-24T18:00:00Z')).toEqual({
      builds: 5,
      merged: 3,
      autoMerged: 2,
      requests: 6,
      accepted: 3,
      question: 1,
      declined: 1,
      findings: 3,
      fixed: 2,
      toMap: { fastest: 10, median: 30, count: 3 },
      readAt: '2026-11-24T18:00:00Z',
    });
  });

  it('leaves out the time to the map when no request has merged', () => {
    const stats = factoryStats([issue(1, ['booth-request', 'declined'])], [], 'now');
    expect(stats.toMap).toBeUndefined();
    expect(stats).toMatchObject({ builds: 0, requests: 1, declined: 1 });
  });

  it('carries only numbers and dates, whatever the issues and pull requests say', () => {
    const sneaky = [
      issue(1, ['booth-request', 'tessl'], [['tessl', '2026-11-20T09:00:00Z']], '<img onerror=x>'),
    ];
    const stats = factoryStats(sneaky, [pull(2, 'tessl/issue-1')], '2026-11-24T18:00:00Z');
    const text = JSON.stringify(stats);
    expect(text).not.toMatch(/img|person1|github\.com|Request/);
    const leaves = (value: unknown): unknown[] =>
      value && typeof value === 'object' ? Object.values(value).flatMap(leaves) : [value];
    for (const leaf of leaves(stats)) {
      expect(typeof leaf === 'number' || /^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(String(leaf))).toBe(
        true,
      );
    }
  });
});
