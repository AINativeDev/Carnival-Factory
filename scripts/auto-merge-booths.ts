/**
 * The auto-merge gate. For each open factory pull request built from a booth
 * request, it gathers the facts, runs the deterministic checks, keeps one
 * checklist comment up to date, and merges only when `evaluateGate` says so.
 *
 * Run by .github/workflows/auto-merge-booths.yml from main's own code, with
 * GITHUB_TOKEN and GITHUB_REPOSITORY set. It reads the pull request's files as
 * text through the API and never checks out or runs its code. DRY_RUN=1 only
 * prints what it would do.
 */
import {
  evaluateGate,
  gateComment,
  RATE_LIMIT_MS,
  type CheckState,
  type GateFacts,
} from './booth-gate.ts';
import { injectionMarkers, scanParticipantText } from './injection-scan.ts';
import { linkedIssue } from './ownership.ts';
import { checkSquareCode, type CodeProblem, type SourceFile } from './square-code.ts';

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
if (!token || !repository) throw new Error('Set GITHUB_TOKEN and GITHUB_REPOSITORY');
const dryRun = process.env.DRY_RUN === '1';
const api = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const FACTORY = 'tessl-app[bot]';
const REVIEWER = 'tessl-reviewer[bot]';
const GUIDE = `https://github.com/${repository}/blob/main/docs/how-it-works.md`;
/** The only kinds of file a booth may hold and still merge without a person. */
const TEXT_FILES = /\.(ts|md)$/;
/** Limits on what the gate reads and compiles, checked from the tree before any file is loaded. */
const MAX_FILES = 40;
const MAX_FILE_BYTES = 100 * 1024;
const MAX_TOTAL_BYTES = 300 * 1024;

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

/** Every page of a list endpoint, so no history is cut off at 100; `stop` ends early. */
async function getAll<T>(path: string, stop?: (page: T[]) => boolean): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; ; page++) {
    const batch = await get<T[]>(
      `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`,
    );
    all.push(...batch);
    if (batch.length < 100 || stop?.(batch)) return all;
  }
}

interface User {
  login: string;
  type: string;
}
interface Label {
  name: string;
}
interface Pull {
  number: number;
  title: string;
  body: string | null;
  user: User;
  labels: Label[];
  updated_at: string;
  merged_at: string | null;
  head: { ref: string; sha: string; repo: { full_name: string } | null };
}
interface Issue {
  number: number;
  state: string;
  title: string;
  body: string | null;
  user: User;
  labels: Label[];
}
interface Comment {
  id: number;
  body: string;
  user: User;
}

const names = (labels: Label[]) => labels.map((label) => label.name);

/** The request issue a factory pull request builds, if it's a booth request by a person. */
async function boothRequest(pull: Pull): Promise<Issue | undefined> {
  const number = linkedIssue(pull.body ?? '', repository!);
  if (!number) return undefined;
  const issue = await get<Issue>(`issues/${number}`);
  if (issue.user.type === 'Bot' || !names(issue.labels).includes('booth-request')) return undefined;
  return issue;
}

async function changedFiles(pull: Pull): Promise<string[]> {
  const files = await getAll<{ filename: string; previous_filename?: string }>(
    `pulls/${pull.number}/files`,
  );
  return files.flatMap((f) => [f.filename, ...(f.previous_filename ? [f.previous_filename] : [])]);
}

/**
 * Every file in the booth's folder at the head commit, read as text, plus any
 * problem with what the folder holds. Sizes are checked from the tree first,
 * so an oversized booth goes to a person without being loaded or compiled.
 */
async function boothFiles(
  sha: string,
  owner: string,
): Promise<{ files: SourceFile[]; problems: CodeProblem[] }> {
  const folder = `booths/${owner}/`;
  const tree = await get<{
    tree: { path: string; type: string; sha: string; mode: string; size?: number }[];
    truncated: boolean;
  }>(`git/trees/${sha}?recursive=1`);
  const files: SourceFile[] = [];
  const problem = (file: string, message: string): CodeProblem => ({
    file,
    line: 0,
    rule: 'files',
    message,
  });
  if (tree.truncated)
    return { files, problems: [problem(folder, 'The tree is too large to check.')] };

  const entries = tree.tree.filter((e) => e.path.startsWith(folder) && e.type === 'blob');
  const total = entries.reduce((sum, e) => sum + (e.size ?? 0), 0);
  const tooBig = entries.find((e) => (e.size ?? 0) > MAX_FILE_BYTES);
  if (entries.length > MAX_FILES || total > MAX_TOTAL_BYTES || tooBig) {
    const limits = `at most ${MAX_FILES} files, ${MAX_FILE_BYTES / 1024} KB each and ${MAX_TOTAL_BYTES / 1024} KB in all`;
    return {
      files,
      problems: [problem(tooBig?.path ?? folder, `Too large to check on its own: ${limits}.`)],
    };
  }
  const problems: CodeProblem[] = [];
  for (const entry of entries) {
    if (entry.mode === '120000' || !TEXT_FILES.test(entry.path)) {
      problems.push(problem(entry.path, 'Only .ts and .md files merge without a person.'));
      continue;
    }
    const blob = await get<{ content: string }>(`git/blobs/${entry.sha}`);
    files.push({ path: entry.path, text: Buffer.from(blob.content, 'base64').toString('utf8') });
  }
  return { files, problems };
}

async function checkStates(sha: string): Promise<Record<string, CheckState>> {
  type Run = { name: string; status: string; conclusion: string | null; started_at: string };
  const runs: Run[] = [];
  for (let page = 1; ; page++) {
    const { check_runs } = await get<{ check_runs: Run[] }>(
      `commits/${sha}/check-runs?per_page=100&page=${page}`,
    );
    runs.push(...check_runs);
    if (check_runs.length < 100) break;
  }
  const latest = new Map<string, Run>();
  for (const run of runs) {
    const seen = latest.get(run.name);
    if (!seen || run.started_at > seen.started_at) latest.set(run.name, run);
  }
  const states: Record<string, CheckState> = {};
  for (const [name, run] of latest) {
    states[name] =
      run.status !== 'completed' ? 'pending' : run.conclusion === 'success' ? 'success' : 'failure';
  }
  return states;
}

async function reviewState(pull: Pull): Promise<GateFacts['review']> {
  const reviews = await getAll<{ user: User; commit_id: string; body: string }>(
    `pulls/${pull.number}/reviews`,
  );
  // Only a review carrying a result counts: the reviewer also posts follow-up
  // reviews, such as replies on threads, that have none.
  const last = reviews
    .filter(
      (r) =>
        r.user.login === REVIEWER &&
        r.commit_id === pull.head.sha &&
        r.body.includes('tessl-code-review:result:v1'),
    )
    .at(-1);
  if (!last) return 'pending';
  return /tessl-code-review:result:v1[^>]*\bapproved=true\b/.test(last.body)
    ? 'approved'
    : 'changes';
}

/** The risk assessment's verdict for exactly this head commit, from its own comment. */
function riskVerdict(all: Comment[], sha: string): GateFacts['risk'] {
  const verdicts = all
    .filter((c) => c.user.login === FACTORY)
    .map((c) =>
      c.body.match(/<!-- assess-booth-risk sha=([0-9a-f]{40}) verdict=(low-risk|needs-human) -->/),
    )
    .filter((m): m is RegExpMatchArray => !!m && m[1] === sha);
  return verdicts.at(-1)?.[2] as GateFacts['risk'];
}

/** Closed pull requests updated at or after `since`, newest first, read until older ones start. */
async function closedSince(since: number): Promise<Pull[]> {
  const pulls = await getAll<Pull>('pulls?state=closed&sort=updated&direction=desc', (page) =>
    page.some((pull) => new Date(pull.updated_at).getTime() < since),
  );
  return pulls.filter((pull) => new Date(pull.updated_at).getTime() >= since);
}

/**
 * When this participant last had a booth merge on its own, within the rate
 * limit's window. Merging updates a pull request, so walking closed pull
 * requests by update time back to the window's start sees every merge in it.
 */
async function lastAutoMerge(owner: string, now: Date): Promise<Date | undefined> {
  const since = now.getTime() - RATE_LIMIT_MS;
  let last: Date | undefined;
  for (const pull of await closedSince(since)) {
    if (!pull.merged_at || !names(pull.labels).includes('auto-merged')) continue;
    const at = new Date(pull.merged_at);
    if (at.getTime() < since) continue;
    const issue = await boothRequest(pull);
    if (issue?.user.login.toLowerCase() !== owner) continue;
    if (!last || at > last) last = at;
  }
  return last;
}

async function upsertComment(number: number, existing: Comment[], body: string) {
  const mine = existing.find(
    (c) => c.user.login === 'github-actions[bot]' && c.body.startsWith('<!-- booth-gate -->'),
  );
  if (mine?.body === body) return;
  if (dryRun) return console.log(`#${number}: would ${mine ? 'update' : 'post'} the checklist`);
  if (mine) await call('PATCH', `issues/comments/${mine.id}`, { body });
  else await call('POST', `issues/${number}/comments`, { body });
}

let merged = false;

async function gate(pull: Pull) {
  const issue = await boothRequest(pull);
  if (!issue) return;
  const owner = issue.user.login.toLowerCase();
  const sha = pull.head.sha;
  const now = new Date();
  const files = await changedFiles(pull);
  // Only an open request counts: accepting a newer one closes the older, so a
  // superseded request's pull request never merges on its own.
  const accepted = issue.state === 'open' && names(issue.labels).includes('tessl');
  const inScope = files.length > 0 && files.every((f) => f.startsWith(`booths/${owner}/`));
  // Only read and compile the booth when the cheap checks already pass.
  const booth = accepted && inScope ? await boothFiles(sha, owner) : { files: [], problems: [] };
  const [checks, review, all] = await Promise.all([
    checkStates(sha),
    reviewState(pull),
    getAll<Comment>(`issues/${pull.number}/comments`),
  ]);
  const facts: GateFacts = {
    owner,
    accepted,
    changedFiles: files,
    codeProblems: [...booth.problems, ...checkSquareCode(`booths/${owner}/`, booth.files)],
    textFindings: [
      ...scanParticipantText(`${issue.title}\n${issue.body ?? ''}`),
      ...injectionMarkers(pull.title),
    ],
    checks,
    review,
    risk: riskVerdict(all, sha),
    labels: names(pull.labels),
    lastAutoMerge: await lastAutoMerge(owner, now),
    now,
  };
  const result = evaluateGate(facts);
  console.log(`#${pull.number} (booth ${owner}, ${sha.slice(0, 7)}): ${result.decision}`);
  await upsertComment(pull.number, all, gateComment(result, GUIDE));

  if (result.decision === 'human' && !facts.labels.includes('needs-human') && !dryRun) {
    await call('POST', `issues/${pull.number}/labels`, { labels: ['needs-human'] });
  }
  if (result.decision !== 'merge' || dryRun) return;
  // Label first, so the merge counts for the rate limit and the digest even if
  // a later step fails; take the label off again if the merge doesn't happen.
  await call('POST', `issues/${pull.number}/labels`, { labels: ['auto-merged'] });
  try {
    // The sha pins the merge to the commit every check ran on: a push since then fails it.
    await call('PUT', `pulls/${pull.number}/merge`, { merge_method: 'merge', sha });
  } catch (error) {
    // The merge may have happened even if its reply was lost: only take the
    // label off when the pull request really isn't merged.
    const after = await get<Pull>(`pulls/${pull.number}`).catch(() => undefined);
    if (after?.merged_at) {
      merged = true;
      return console.log(`#${pull.number}: merged (its reply was lost)`);
    }
    if (after) await call('DELETE', `issues/${pull.number}/labels/auto-merged`).catch(() => {});
    throw error;
  }
  merged = true;
  console.log(`#${pull.number}: merged`);
}

/**
 * Publishes the map if an auto-merge is newer than the last successful Pages
 * run. A merge by this workflow's token starts no push workflows, so this is
 * how the map updates, and checking on every run retries a failed dispatch.
 */
async function publishIfBehind() {
  type Runs = { workflow_runs: { created_at: string }[] };
  const done = await get<Runs>('actions/workflows/pages.yml/runs?status=success&per_page=1');
  const lastPublished = new Date(done.workflow_runs[0]?.created_at ?? 0).getTime();
  const running = await get<Runs>('actions/workflows/pages.yml/runs?status=in_progress&per_page=1');
  const behind = (await closedSince(lastPublished)).some(
    (pull) =>
      pull.merged_at &&
      names(pull.labels).includes('auto-merged') &&
      new Date(pull.merged_at).getTime() > lastPublished,
  );
  if (!(behind || merged) || running.workflow_runs.length > 0) return;
  if (dryRun) return console.log('would publish the map');
  await call('POST', 'actions/workflows/pages.yml/dispatches', { ref: 'main' });
  console.log('published the map');
}

const pulls = await getAll<Pull>('pulls?state=open');
for (const pull of pulls) {
  const fromFactory =
    pull.user.login === FACTORY &&
    pull.head.ref.startsWith('tessl/') &&
    pull.head.repo?.full_name === repository;
  if (!fromFactory) continue;
  try {
    await gate(pull);
  } catch (error) {
    console.error(`#${pull.number}: ${String(error)}`);
    process.exitCode = 1;
  }
}
await publishIfBehind();
