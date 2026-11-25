/**
 * Pins each reason the merge gate's runner waits rather than merging: a check
 * still running or failed, the code review not in or asking for changes, no
 * risk verdict for the head commit yet, and the per-person hourly limit.
 * Waiting writes the checklist and nothing else.
 */
import { describe, expect, it } from 'vitest';
import type { Routes } from './merge-gate-fake-github.ts';
import {
  boothPull,
  boothRequest,
  mergeableBooth,
  minutesAgo,
  review,
  riskComment,
  runGate,
  SHA,
} from './merge-gate-world.ts';

const CHECKS = `GET commits/${SHA}/check-runs`;
const run = (name: string, status: string, conclusion: string | null, startedMinutesAgo = 10) => ({
  name,
  status,
  conclusion,
  started_at: minutesAgo(startedMinutesAgo),
});
const passing = ['check', 'ownership', 'build'].map((name) => run(name, 'completed', 'success'));
const OTHER_SHA = 'b'.repeat(40);

/** An auto-merged pull request for request #`issue`, merged `minutes` ago. */
const autoMerged = (issue: number, minutes: number) =>
  boothPull({
    number: 20 + issue,
    body: `Closes #${String(issue)}`,
    labels: [{ name: 'auto-merged' }],
    updated_at: minutesAgo(minutes),
    merged_at: minutesAgo(minutes),
  });

const waits: [string, (routes: Routes) => void][] = [
  [
    'smoke is still running',
    (r) => (r[CHECKS] = { check_runs: [...passing, run('smoke', 'in_progress', null)] }),
  ],
  ['smoke has not started', (r) => (r[CHECKS] = { check_runs: passing })],
  [
    'smoke failed, which the shepherd fixes',
    (r) => (r[CHECKS] = { check_runs: [...passing, run('smoke', 'completed', 'failure')] }),
  ],
  ['the review is not in', (r) => (r['GET pulls/7/reviews'] = [])],
  ['the review asks for changes', (r) => (r['GET pulls/7/reviews'] = [review(false)])],
  [
    'the only review is on an older commit',
    (r) => (r['GET pulls/7/reviews'] = [review(true, OTHER_SHA)]),
  ],
  [
    'the only approval is not the reviewer’s',
    (r) => (r['GET pulls/7/reviews'] = [review(true, SHA, 'holly')]),
  ],
  [
    'the latest review with a result asks for changes',
    (r) =>
      (r['GET pulls/7/reviews'] = [
        review(true),
        review(false),
        { user: { login: 'tessl-reviewer[bot]' }, commit_id: SHA, body: 'Replied on a thread.' },
      ]),
  ],
  ['there is no risk verdict', (r) => (r['GET issues/7/comments'] = [])],
  [
    'the risk verdict is for another commit',
    (r) => (r['GET issues/7/comments'] = [riskComment('low-risk', OTHER_SHA)]),
  ],
  [
    'the risk verdict is not the factory’s',
    (r) => (r['GET issues/7/comments'] = [riskComment('low-risk', SHA, 'holly')]),
  ],
  [
    'holly had a booth merge on its own forty minutes ago',
    (r) => {
      r['GET pulls?state=closed&sort=updated&direction=desc'] = [autoMerged(3, 40)];
      r['GET issues/3'] = boothRequest({ number: 3, state: 'closed' });
    },
  ],
];

describe('the gate waits', () => {
  it.each(waits)('when %s', async (_, change) => {
    const routes = mergeableBooth();
    change(routes);
    const result = await runGate(routes);
    expect(result.logs[0]).toBe(`#7 (booth holly, ${SHA.slice(0, 7)}): wait`);
    expect(result.writes().map((w) => `${w.method} ${w.path}`)).toEqual(['POST issues/7/comments']);
  });
});

describe('the hourly limit', () => {
  const decide = async (closed: object[], issues: Routes = {}) => {
    const routes = { ...mergeableBooth(), ...issues };
    routes['GET pulls?state=closed&sort=updated&direction=desc'] = closed;
    return (await runGate(routes)).logs[0];
  };
  const merges = `#7 (booth holly, ${SHA.slice(0, 7)}): merge`;
  const holly3 = { 'GET issues/3': boothRequest({ number: 3, state: 'closed' }) };

  it('counts the latest of several merges in the hour', async () => {
    const older = { ...autoMerged(3, 50), number: 30 };
    expect(await decide([autoMerged(3, 70), older, autoMerged(3, 10)], holly3)).toContain('wait');
  });

  it('forgets a merge more than an hour ago, even on a pull request updated since', async () => {
    const updatedLater = { ...autoMerged(3, 90), updated_at: minutesAgo(5) };
    expect(await decide([updatedLater], holly3)).toBe(merges);
  });

  it('ignores merges without auto-merged, and closed pull requests that never merged', async () => {
    const byHand = { ...autoMerged(3, 10), labels: [] };
    const closed = { ...autoMerged(3, 10), merged_at: null };
    expect(await decide([byHand, closed], holly3)).toBe(merges);
  });

  it('ignores another person’s merge, and one with no booth request behind it', async () => {
    const someoneElse = {
      'GET issues/4': boothRequest({ number: 4, user: { login: 'ivy', type: 'User' } }),
    };
    const unlinked = { ...autoMerged(9, 10), body: 'No link.' };
    expect(await decide([autoMerged(4, 10), unlinked], someoneElse)).toBe(merges);
  });

  it('reads closed pull requests page by page until they are older than the hour', async () => {
    const recent = Array.from({ length: 100 }, (_, i) => ({
      ...autoMerged(3, 20),
      labels: [],
      number: 100 + i,
    }));
    const routes: Routes = { ...mergeableBooth(), ...holly3 };
    routes['GET pulls?state=closed&sort=updated&direction=desc'] = [
      ...recent,
      autoMerged(3, 30),
      autoMerged(3, 70),
      ...recent,
    ];
    const result = await runGate(routes);
    expect(result.logs[0]).toContain('wait');
    const pages = result.requests.filter((r) => r.path.startsWith('pulls?state=closed'));
    expect(pages.map((r) => r.path.slice(-6))).toEqual(['page=1', 'page=2', 'page=1', 'page=2']);
  });
});
