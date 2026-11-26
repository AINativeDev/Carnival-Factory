/**
 * Pins which pull requests the merge gate's runner takes (only the factory's,
 * from a tessl/ branch of this repository, built from a person's booth or
 * level request), how one failing doesn't stop the rest, and when it publishes the
 * map.
 */
import { describe, expect, it } from 'vitest';
import { HttpFailure } from './merge-gate-fake-github.ts';
import {
  boothPull,
  boothRequest,
  mergeableBooth,
  minutesAgo,
  runGate,
  SHA,
} from './merge-gate-world.ts';

const PAGES = 'actions/workflows/pages.yml/dispatches';
const asks = (run: { requests: { path: string }[] }) => run.requests.map((r) => r.path);

describe('the pull requests the gate takes', () => {
  it.each([
    [
      'from a fork',
      { head: { ref: 'tessl/issue-5', sha: SHA, repo: { full_name: 'grinch/carnival' } } },
    ],
    ['from a deleted fork', { head: { ref: 'tessl/issue-5', sha: SHA, repo: null } }],
    [
      'from a branch that is not the factory’s',
      { head: { ref: 'holly/wreath', sha: SHA, repo: { full_name: 'elves/carnival' } } },
    ],
    ['by someone other than the factory', { user: { login: 'holly', type: 'User' } }],
  ])('leaves alone a pull request %s', async (_, change) => {
    const routes = mergeableBooth();
    routes['GET pulls?state=open'] = [boothPull(change)];
    const run = await runGate(routes);
    expect(asks(run)).not.toContain('issues/5');
    expect(run.writes()).toEqual([]);
    expect(run.logs).toEqual([]);
  });

  it.each([
    ['links no issue', 'GET pulls?state=open', [boothPull({ body: null })]],
    [
      'builds a request that is neither a booth’s nor a level’s',
      'GET issues/5',
      boothRequest({ labels: [{ name: 'feedback' }, { name: 'tessl' }] }),
    ],
    [
      'builds a bot’s request',
      'GET issues/5',
      boothRequest({ user: { login: 'dependabot[bot]', type: 'Bot' } }),
    ],
  ])('leaves alone a factory pull request that %s', async (_, route, answer) => {
    const routes = mergeableBooth();
    routes[route] = answer;
    const run = await runGate(routes);
    expect(asks(run)).not.toContain('pulls/7/files');
    expect(run.writes()).toEqual([]);
  });

  it('gates every open pull request, page by page', async () => {
    const others = Array.from({ length: 100 }, (_, i) =>
      boothPull({ number: 200 + i, user: { login: 'holly', type: 'User' } }),
    );
    const routes = mergeableBooth();
    routes['GET pulls?state=open'] = [...others, boothPull()];
    const run = await runGate(routes);
    expect(run.logs[0]).toContain('#7 (booth holly');
  });

  it('reports a pull request it could not gate and goes on to the next', async () => {
    const routes = mergeableBooth();
    routes['GET pulls?state=open'] = [boothPull({ number: 6, body: 'Closes #4' }), boothPull()];
    routes['GET issues/4'] = new HttpFailure(500);
    const run = await runGate(routes);
    expect(run.errors).toEqual(['#6: Error: GET issues/4 answered HTTP 500']);
    expect(run.logs).toContain('#7: merged');
    expect(run.exitCode).toBe(1);
  });

  it('refuses to run without a token and a repository', async () => {
    await expect(runGate(mergeableBooth(), { token: '' })).rejects.toThrow(
      'Set GITHUB_TOKEN and GITHUB_REPOSITORY',
    );
  });
});

describe('publishing the map', () => {
  /** A run where #7 waits, so nothing merges in it. */
  const waiting = () => {
    const routes = mergeableBooth();
    routes['GET pulls/7/reviews'] = [];
    return routes;
  };
  const merged = (minutes: number, labels = [{ name: 'auto-merged' }]) =>
    boothPull({
      number: 8,
      labels,
      merged_at: minutesAgo(minutes),
      updated_at: minutesAgo(minutes),
    });

  it('does nothing when nothing changed since the last publish', async () => {
    expect(asks(await runGate(waiting()))).not.toContain(PAGES);
  });

  it('publishes an auto-merge from an earlier run that the map is behind', async () => {
    const routes = waiting();
    routes['GET pulls?state=closed&sort=updated&direction=desc'] = [merged(70), merged(10)];
    expect(asks(await runGate(routes))).toContain(PAGES);
  });

  it('does not publish for a merge by hand, or one the map already has', async () => {
    const routes = waiting();
    routes['GET pulls?state=closed&sort=updated&direction=desc'] = [merged(10, []), merged(40)];
    expect(asks(await runGate(routes))).not.toContain(PAGES);
  });

  it('reads closed pull requests page by page, back to the last publish', async () => {
    // A full first page of recent closes, then a page reaching past the last publish:
    // the auto-merge on it the map already has, so nothing publishes.
    const routes = waiting();
    const recent = Array.from({ length: 100 }, (_, i) => ({ ...merged(5, []), number: 100 + i }));
    routes['GET pulls?state=closed&sort=updated&direction=desc'] = [
      ...recent,
      merged(40),
      merged(90),
    ];
    expect(asks(await runGate(routes))).not.toContain(PAGES);
  });

  it('publishes from scratch when the map was never published', async () => {
    const routes = waiting();
    routes['GET actions/workflows/pages.yml/runs?status=success'] = { workflow_runs: [] };
    routes['GET pulls?state=closed&sort=updated&direction=desc'] = [merged(60 * 24 * 30)];
    expect(asks(await runGate(routes))).toContain(PAGES);
  });

  it('waits for a publish already running', async () => {
    const routes = mergeableBooth();
    routes['GET actions/workflows/pages.yml/runs?status=in_progress'] = {
      workflow_runs: [{ created_at: minutesAgo(1) }],
    };
    const run = await runGate(routes);
    expect(run.logs).toContain('#7: merged');
    expect(asks(run)).not.toContain(PAGES);
  });

  it('does not publish a hold labelled before the last publish', async () => {
    const routes = waiting();
    routes['GET pulls?state=open'] = [boothPull({ labels: [{ name: 'needs-human' }] })];
    routes['GET issues/7/events'] = [
      { event: 'labeled', label: { name: 'needs-human' }, created_at: minutesAgo(40) },
      { event: 'unlabeled', label: { name: 'needs-human' }, created_at: minutesAgo(20) },
      { event: 'labeled', label: { name: 'auto-merged' }, created_at: minutesAgo(10) },
      { event: 'assigned', created_at: minutesAgo(5) },
    ];
    expect(asks(await runGate(routes))).not.toContain(PAGES);
  });
});
