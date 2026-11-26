/**
 * Pins each reason the merge gate's runner waits rather than merging: a check
 * still running or failed, the code review not in or asking for changes, no
 * risk verdict for the head commit yet, and a person's changes one after another.
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

describe('one person, several booth changes', () => {
  it("merges a person's next change minutes after their last one merged on its own", async () => {
    const routes: Routes = mergeableBooth();
    routes['GET pulls?state=closed&sort=updated&direction=desc'] = [autoMerged(3, 5)];
    routes['GET issues/3'] = boothRequest({ number: 3, state: 'closed' });
    expect((await runGate(routes)).logs[0]).toBe(`#7 (booth holly, ${SHA.slice(0, 7)}): merge`);
  });
});
