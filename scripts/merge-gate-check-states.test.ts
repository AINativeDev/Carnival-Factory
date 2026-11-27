/**
 * How the merge gate reads each required check's state on the head commit from
 * its check runs: every page of them, the run that started last, and a run
 * that ran over a skipped one (docs/specs/auto-merge-gate.md).
 */
import { describe, expect, it } from 'vitest';
import { scriptedGitHub } from './merge-gate-fake-github.ts';
import { gatherFacts } from './merge-gate-facts.ts';
import { boothPull, boothRequest, mergeableBooth, minutesAgo, SHA } from './merge-gate-world.ts';

async function gather(runs: object[]) {
  const routes = mergeableBooth();
  routes[`GET commits/${SHA}/check-runs`] = { check_runs: runs };
  // With no changed files the gate compiles no booth, so each read stays quick.
  routes['GET pulls/7/files'] = [];
  const github = scriptedGitHub(routes);
  const { facts } = await gatherFacts(github.client, boothPull(), boothRequest());
  return { facts, paths: github.requests.map((r) => r.path) };
}

describe('the checks fact', () => {
  const run = (name: string, status: string, conclusion: string | null, started: number) => ({
    name,
    status,
    conclusion,
    started_at: minutesAgo(started),
  });
  const checks = async (runs: object[]) => {
    const { facts, paths } = await gather(runs);
    return { states: facts.checks, pages: paths.filter((p) => p.includes('check-runs')) };
  };

  it('says pending, success or failure from each run', async () => {
    const { states, pages } = await checks([
      run('check', 'in_progress', null, 1),
      run('build', 'completed', 'success', 1),
      run('smoke', 'completed', 'cancelled', 1),
      run('lint', 'completed', null, 1),
    ]);
    expect(states).toEqual({
      check: 'pending',
      build: 'success',
      smoke: 'failure',
      lint: 'failure',
    });
    expect(pages).toEqual([`commits/${SHA}/check-runs?per_page=100&page=1`]);
  });

  it('takes the run that started last, whatever order they come in', async () => {
    const older = run('smoke', 'completed', 'failure', 9);
    const newer = run('smoke', 'completed', 'success', 2);
    expect((await checks([older, newer])).states.smoke).toBe('success');
    expect((await checks([newer, older])).states.smoke).toBe('success');
  });

  it('takes a run that ran over a skipped one, even an older run', async () => {
    const skipped = run('smoke', 'completed', 'skipped', 1);
    const ran = run('smoke', 'completed', 'success', 9);
    expect((await checks([skipped, ran])).states.smoke).toBe('success');
    expect((await checks([ran, skipped])).states.smoke).toBe('success');
  });

  it('counts a check whose only run was skipped as not passed', async () => {
    expect((await checks([run('smoke', 'completed', 'skipped', 1)])).states).toEqual({
      smoke: 'failure',
    });
  });

  it('keeps the first of two runs that started at once', async () => {
    const first = run('smoke', 'completed', 'success', 3);
    const second = run('smoke', 'completed', 'failure', 3);
    expect((await checks([first, second])).states.smoke).toBe('success');
  });

  it('reads the next page after a full one', async () => {
    const runs = Array.from({ length: 100 }, (_, n) => run(`job ${String(n)}`, 'queued', null, 1));
    const { states, pages } = await checks([...runs, run('smoke', 'completed', 'success', 1)]);
    expect(pages).toHaveLength(2);
    expect(states.smoke).toBe('success');
  });
});
