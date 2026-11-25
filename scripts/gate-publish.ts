/**
 * Publishing the map after the auto-merge gate's run, so an auto-merge or a
 * construction site moving to "Waiting for a maintainer" shows within
 * minutes. The API client is passed in, so the tests run it against a
 * scripted one; the entry point is scripts/auto-merge-booths.ts.
 */
import { closedSince, getAll, names, type GitHub, type Label } from './gate-github.ts';

/** Whether needs-human was last put on a pull request after `since`. */
async function labelledSince(github: GitHub, number: number, since: number): Promise<boolean> {
  type Event = { event: string; label?: Label; created_at: string };
  const events = await getAll<Event>(github, `issues/${number}/events`);
  const last = events
    .filter((e) => e.event === 'labeled' && e.label?.name === 'needs-human')
    .at(-1);
  return !!last && new Date(last.created_at).getTime() > since;
}

/**
 * Publishes the map if an auto-merge, or needs-human going on a pull request
 * (which moves its booth's construction site to "Waiting for a maintainer"),
 * is newer than the last successful Pages run. A merge or a label by this
 * workflow's token starts no other workflows, so this is how the map updates.
 * Both are read from GitHub rather than remembered, so every run retries a
 * dispatch that failed or was skipped while a deploy was already running.
 * `merged` says whether this run merged anything, and `held` is the pull
 * requests it found with needs-human.
 */
export async function publishIfBehind(github: GitHub, merged: boolean, held: ReadonlySet<number>) {
  type Runs = { workflow_runs: { created_at: string }[] };
  const done = await github.call<Runs>(
    'GET',
    'actions/workflows/pages.yml/runs?status=success&per_page=1',
  );
  const lastPublished = new Date(done.workflow_runs[0]?.created_at ?? 0).getTime();
  const running = await github.call<Runs>(
    'GET',
    'actions/workflows/pages.yml/runs?status=in_progress&per_page=1',
  );
  const behind = (await closedSince(github, lastPublished)).some(
    (pull) =>
      pull.merged_at &&
      names(pull.labels).includes('auto-merged') &&
      new Date(pull.merged_at).getTime() > lastPublished,
  );
  if (running.workflow_runs.length > 0) return;
  let stale = behind || merged;
  for (const number of held) stale ||= await labelledSince(github, number, lastPublished);
  if (!stale) return;
  if (github.dryRun) {
    console.log('would publish the map');
    return;
  }
  await github.call('POST', 'actions/workflows/pages.yml/dispatches', { ref: 'main' });
  console.log('published the map');
}
