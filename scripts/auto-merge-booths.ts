/**
 * The auto-merge gate. For each open factory pull request built from a booth
 * or level request (ADR 0031), it gathers the facts, runs the deterministic
 * checks, keeps one checklist comment up to date, and merges only when
 * `evaluateGate` says so.
 *
 * Run by .github/workflows/auto-merge-booths.yml from main's own code, with
 * GITHUB_TOKEN and GITHUB_REPOSITORY set. It reads the pull request's files as
 * text through the API and never checks out or runs its code. DRY_RUN=1 only
 * prints what it would do.
 */
import { closedSince, getAll, names, type GitHub, type Label, type Pull } from './gate-github.ts';
import { gatePull } from './gate-pull.ts';

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
if (!token || !repository) throw new Error('Set GITHUB_TOKEN and GITHUB_REPOSITORY');
const dryRun = process.env.DRY_RUN === '1';
const api = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const FACTORY = 'tessl-app[bot]';
const GUIDE = `https://github.com/${repository}/blob/main/docs/how-it-works.md`;

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${api}/repos/${repository}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${path} answered HTTP ${response.status}`);
  return (response.status === 204 ? undefined : await response.json()) as T;
}
const get = <T>(path: string) => call<T>('GET', path);
const github: GitHub = { repository, dryRun, call };

let merged = false;
/** Factory pull requests with needs-human, which puts their booth's site at "Waiting for a maintainer". */
const held = new Set<number>();

/** Whether needs-human was last put on a pull request after `since`. */
async function labelledSince(number: number, since: number): Promise<boolean> {
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
 */
async function publishIfBehind() {
  type Runs = { workflow_runs: { created_at: string }[] };
  const done = await get<Runs>('actions/workflows/pages.yml/runs?status=success&per_page=1');
  const lastPublished = new Date(done.workflow_runs[0]?.created_at ?? 0).getTime();
  const running = await get<Runs>('actions/workflows/pages.yml/runs?status=in_progress&per_page=1');
  const behind = (await closedSince(github, lastPublished)).some(
    (pull) =>
      pull.merged_at &&
      names(pull.labels).includes('auto-merged') &&
      new Date(pull.merged_at).getTime() > lastPublished,
  );
  if (running.workflow_runs.length > 0) return;
  let stale = behind || merged;
  for (const number of held) stale ||= await labelledSince(number, lastPublished);
  if (!stale) return;
  if (dryRun) return console.log('would publish the map');
  await call('POST', 'actions/workflows/pages.yml/dispatches', { ref: 'main' });
  console.log('published the map');
}

const pulls = await getAll<Pull>(github, 'pulls?state=open');
for (const pull of pulls) {
  const fromFactory =
    pull.user.login === FACTORY &&
    pull.head.ref.startsWith('tessl/') &&
    pull.head.repo?.full_name === repository;
  if (!fromFactory) continue;
  try {
    const outcome = await gatePull(github, pull, GUIDE);
    merged ||= outcome.merged;
    if (outcome.held) held.add(pull.number);
  } catch (error) {
    console.error(`#${pull.number}: ${String(error)}`);
    process.exitCode = 1;
  }
}
await publishIfBehind();
