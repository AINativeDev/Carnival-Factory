/**
 * Publishing the map after the merge gate's round, when an auto-merge or a
 * hold is newer than the last successful Pages run.
 */
import { get, getAll, names, type GitHub, type Label } from './merge-gate-github.ts';
import { closedSince } from './merge-gate-requests.ts';

/** Whether needs-human was last put on a pull request after `since`. */
async function labelledSince(github: GitHub, number: number, since: number): Promise<boolean> {
  type Event = { event: string; label?: Label; created_at: string };
  const events = await getAll<Event>(github, `issues/${String(number)}/events`);
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
 * `merged` says this round merged a booth, and `held` are the pull requests
 * it saw with needs-human.
 */
export async function publishIfBehind(
  github: GitHub,
  { merged, held, dryRun }: { merged: boolean; held: ReadonlySet<number>; dryRun: boolean },
) {
  type Runs = { workflow_runs: { created_at: string }[] };
  const pages = 'actions/workflows/pages.yml';
  const done = await get<Runs>(github, `${pages}/runs?status=success&per_page=1`);
  const lastPublished = new Date(done.workflow_runs[0]?.created_at ?? 0).getTime();
  const running = await get<Runs>(github, `${pages}/runs?status=in_progress&per_page=1`);
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
  if (dryRun) {
    console.log('would publish the map');
    return;
  }
  await github.call('POST', `${pages}/dispatches`, { ref: 'main' });
  console.log('published the map');
}
