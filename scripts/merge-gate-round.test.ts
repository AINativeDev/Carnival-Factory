/**
 * The merge gate's round with the scripted GitHub passed straight in as its
 * client, for what the runner's own tests don't reach: long lists of check
 * runs, a request with no body, publishing on a dry run, the order merges
 * come back in, and GitHub's own address when none is set.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpFailure, scriptedGitHub, type Routes } from './merge-gate-fake-github.ts';
import { runMergeGate } from './merge-gate-round.ts';
import {
  boothPull,
  boothRequest,
  mergeableBooth,
  minutesAgo,
  NOW,
  REPOSITORY,
  runGate,
  SHA,
} from './merge-gate-world.ts';

let logs: string[] = [];
beforeEach(() => {
  logs = [];
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  vi.spyOn(console, 'log').mockImplementation((line: string) => logs.push(line));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const round = async (routes: Routes, dryRun = false) => {
  const github = scriptedGitHub(routes);
  const ok = await runMergeGate(github.client, { repository: REPOSITORY, dryRun });
  return { ...github, ok };
};
const autoMerged = (minutes: number) =>
  boothPull({
    number: 8,
    body: 'Closes #3',
    labels: [{ name: 'auto-merged' }],
    updated_at: minutesAgo(minutes),
    merged_at: minutesAgo(minutes),
  });

describe('runMergeGate', () => {
  it('merges a booth that passes every step', async () => {
    const run = await round(mergeableBooth());
    expect(run.ok).toBe(true);
    expect(run.writes().map((w) => w.path)).toContain('pulls/7/merge');
  });

  it('reads every page of check runs, and the latest run of each check counts', async () => {
    const run = (name: string, conclusion: string, started: number) => ({
      name,
      status: 'completed',
      conclusion,
      started_at: minutesAgo(started),
    });
    const routes = mergeableBooth();
    const lint = Array.from({ length: 100 }, (_, i) => run(`lint ${String(i)}`, 'success', 9));
    routes[`GET commits/${SHA}/check-runs`] = {
      check_runs: [
        ...lint,
        run('smoke', 'success', 5),
        run('smoke', 'failure', 8),
        ...['check', 'ownership', 'build'].map((name) => run(name, 'success', 9)),
      ],
    };
    await round(routes);
    expect(logs[0]).toContain(': merge');
  });

  it('reads a request with no body', async () => {
    const routes = mergeableBooth();
    routes['GET issues/5'] = boothRequest({ body: null });
    await round(routes);
    expect(logs[0]).toContain(': merge');
  });

  it('counts the latest merge in the hour, whatever order they come in', async () => {
    const routes = mergeableBooth();
    routes['GET pulls?state=closed&sort=updated&direction=desc'] = [autoMerged(10), autoMerged(40)];
    routes['GET issues/3'] = boothRequest({ number: 3, state: 'closed' });
    await round(routes);
    expect(logs[0]).toContain(': wait');
  });

  it('says it would publish on a dry run when the map is behind', async () => {
    const routes = mergeableBooth();
    routes['GET pulls?state=closed&sort=updated&direction=desc'] = [autoMerged(90)];
    routes['GET actions/workflows/pages.yml/runs?status=success'] = {
      workflow_runs: [{ created_at: minutesAgo(120) }],
    };
    const run = await round(routes, true);
    expect(run.writes()).toEqual([]);
    expect(logs).toContain('would publish the map');
  });
});

describe('a round with a failure', () => {
  it('says so, after gating the rest', async () => {
    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((line: string) => errors.push(line));
    const routes = mergeableBooth();
    routes['GET pulls/7/reviews'] = new HttpFailure(500);
    const run = await round(routes);
    expect(run.ok).toBe(false);
    expect(errors).toEqual([
      '#7: Error: GET pulls/7/reviews?per_page=100&page=1 answered HTTP 500',
    ]);
  });
});

describe('a request GitHub no longer has', () => {
  it('fails that pull request with GitHub’s 404', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const routes = mergeableBooth();
    delete routes['GET issues/5'];
    const run = await round(routes);
    expect(run.ok).toBe(false);
    expect(run.writes().map((w) => w.path)).not.toContain('pulls/7/merge');
  });
});

describe('the runner', () => {
  it('calls GitHub’s own API when no other is set', async () => {
    const run = await runGate(mergeableBooth(), { apiUrlSet: false });
    expect(run.logs).toContain('#7: merged');
  });
});
