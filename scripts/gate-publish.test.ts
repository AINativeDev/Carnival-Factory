import { describe, expect, it, vi } from 'vitest';
import { fakeGitHub, levelPull } from './gate-fake.ts';
import { publishIfBehind } from './gate-publish.ts';

const DONE = 'actions/workflows/pages.yml/runs?status=success&per_page=1';
const RUNNING = 'actions/workflows/pages.yml/runs?status=in_progress&per_page=1';
const CLOSED = 'pulls?state=closed&sort=updated&direction=desc&per_page=100&page=1';
const EVENTS = 'issues/9/events?per_page=100&page=1';
const PUBLISH = 'POST actions/workflows/pages.yml/dispatches';
const published = '2026-12-01T10:00:00Z';

vi.spyOn(console, 'log').mockImplementation(() => undefined);

/** The writes publishing makes, with the last Pages run at `published`; `sent` gets their bodies. */
async function publish(
  change: Record<string, unknown>,
  merged = false,
  held: number[] = [],
  dryRun = false,
  sent: unknown[] = [],
) {
  const replies = new Map<string, unknown>([
    [DONE, { workflow_runs: [{ created_at: published }] }],
    [RUNNING, { workflow_runs: [] }],
    [CLOSED, []],
    [EVENTS, []],
  ]);
  for (const [path, reply] of Object.entries(change)) replies.set(path, reply);
  const fake = fakeGitHub(replies);
  await publishIfBehind({ ...fake.github, dryRun }, merged, new Set(held));
  sent.push(...fake.sent.map((write) => write.body));
  return fake.writes;
}

describe('publishIfBehind', () => {
  it('publishes after a merge this run made, or one since the last deploy', async () => {
    const sent: unknown[] = [];
    expect(await publish({}, true, [], false, sent)).toEqual([PUBLISH]);
    expect(sent).toEqual([{ ref: 'main' }]);
    const since = {
      ...levelPull,
      updated_at: '2026-12-01T11:00:00Z',
      merged_at: '2026-12-01T11:00:00Z',
      labels: [{ name: 'auto-merged' }],
    };
    expect(await publish({ [CLOSED]: [since] })).toEqual([PUBLISH]);
  });

  it('publishes when needs-human went on a held pull request since the last deploy', async () => {
    const labelled = (at: string) => [
      { event: 'labeled', label: { name: 'needs-human' }, created_at: at },
    ];
    expect(await publish({ [EVENTS]: labelled('2026-12-01T11:00:00Z') }, false, [9])).toEqual([
      PUBLISH,
    ]);
    expect(await publish({ [EVENTS]: labelled('2026-12-01T09:00:00Z') }, false, [9])).toEqual([]);
  });

  it('waits for a deploy already running, does nothing when up to date, and never on a dry run', async () => {
    expect(
      await publish({ [RUNNING]: { workflow_runs: [{ created_at: published }] } }, true),
    ).toEqual([]);
    expect(await publish({ [DONE]: { workflow_runs: [] } })).toEqual([]);
    expect(await publish({}, true, [], true)).toEqual([]);
  });
});
