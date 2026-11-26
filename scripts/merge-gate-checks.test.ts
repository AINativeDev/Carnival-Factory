/**
 * How the merge gate reads a booth's check runs on its head commit: every page
 * of them, the latest run of each check, and a skipped run that a later event
 * starts, such as CI again for the low-risk label (docs/specs/auto-merge-gate.md).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scriptedGitHub, type Routes } from './merge-gate-fake-github.ts';
import { runMergeGate } from './merge-gate-round.ts';
import { mergeableBooth, minutesAgo, NOW, REPOSITORY, SHA } from './merge-gate-world.ts';

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

const round = async (routes: Routes) => {
  await runMergeGate(scriptedGitHub(routes).client, { repository: REPOSITORY, dryRun: false });
};

describe("the gate's check runs", () => {
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

  it('passes over a skipped run of a check, which a later event like a label starts', async () => {
    // Adding low-risk starts CI again for the label, where its jobs are skipped:
    // the check passed on this commit, and the skipped run says nothing new.
    const run = (name: string, conclusion: string, started: number) => ({
      name,
      status: 'completed',
      conclusion,
      started_at: minutesAgo(started),
    });
    const routes = mergeableBooth();
    routes[`GET commits/${SHA}/check-runs`] = {
      check_runs: [
        run('ownership', 'skipped', 1),
        ...['check', 'ownership', 'build', 'smoke'].map((name) => run(name, 'success', 9)),
        run('check', 'skipped', 2),
      ],
    };
    await round(routes);
    expect(logs[0]).toContain(': merge');
  });

  it('still holds a check whose only run was skipped', async () => {
    const routes = mergeableBooth();
    routes[`GET commits/${SHA}/check-runs`] = {
      check_runs: ['check', 'ownership', 'build', 'smoke'].map((name) => ({
        name,
        status: 'completed',
        conclusion: name === 'smoke' ? 'skipped' : 'success',
        started_at: minutesAgo(5),
      })),
    };
    await round(routes);
    expect(logs[0]).not.toContain(': merge');
  });
});
