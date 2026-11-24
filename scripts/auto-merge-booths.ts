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
import { evaluateGate, gateComment, type CheckState, type GateFacts } from './booth-gate.ts';
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
  merged_at: string | null;
  head: { ref: string; sha: string; repo: { full_name: string } | null };
}
interface Issue {
  number: number;
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
  const files: string[] = [];
  for (let page = 1; ; page++) {
    const batch = await get<{ filename: string; previous_filename?: string }[]>(
      `pulls/${pull.number}/files?per_page=100&page=${page}`,
    );
    for (const file of batch)
      files.push(file.filename, ...(file.previous_filename ? [file.previous_filename] : []));
    if (batch.length < 100) return files;
  }
}

/** Every file in the booth's folder at the head commit, read as text, and any file it may not hold. */
async function boothFiles(
  sha: string,
  owner: string,
): Promise<{ files: SourceFile[]; problems: CodeProblem[] }> {
  const folder = `booths/${owner}/`;
  const tree = await get<{
    tree: { path: string; type: string; sha: string; mode: string }[];
    truncated: boolean;
  }>(`git/trees/${sha}?recursive=1`);
  const files: SourceFile[] = [];
  const problems: CodeProblem[] = [];
  if (tree.truncated)
    problems.push({
      file: folder,
      line: 0,
      rule: 'files',
      message: 'The tree is too large to check.',
    });
  for (const entry of tree.tree) {
    if (!entry.path.startsWith(folder) || entry.type !== 'blob') continue;
    if (entry.mode === '120000' || !TEXT_FILES.test(entry.path)) {
      problems.push({
        file: entry.path,
        line: 0,
        rule: 'files',
        message: 'Only .ts and .md files merge without a person.',
      });
      continue;
    }
    const blob = await get<{ content: string; encoding: string }>(`git/blobs/${entry.sha}`);
    files.push({ path: entry.path, text: Buffer.from(blob.content, 'base64').toString('utf8') });
  }
  return { files, problems };
}

async function checkStates(sha: string): Promise<Record<string, CheckState>> {
  const { check_runs } = await get<{
    check_runs: { name: string; status: string; conclusion: string | null; started_at: string }[];
  }>(`commits/${sha}/check-runs?per_page=100`);
  const latest = new Map<string, (typeof check_runs)[number]>();
  for (const run of check_runs) {
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
  const reviews = await get<{ user: User; commit_id: string; body: string }[]>(
    `pulls/${pull.number}/reviews?per_page=100`,
  );
  const mine = reviews.filter((r) => r.user.login === REVIEWER && r.commit_id === pull.head.sha);
  const last = mine.at(-1);
  if (!last) return 'pending';
  return /tessl-code-review:result:v1[^>]*\bapproved=true\b/.test(last.body)
    ? 'approved'
    : 'changes';
}

async function comments(number: number): Promise<Comment[]> {
  return get<Comment[]>(`issues/${number}/comments?per_page=100`);
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

/** When this participant last had a booth merge on its own. */
async function lastAutoMerge(owner: string): Promise<Date | undefined> {
  const recent = await get<Pull[]>('pulls?state=closed&sort=updated&direction=desc&per_page=30');
  let last: Date | undefined;
  for (const pull of recent) {
    if (!pull.merged_at || !names(pull.labels).includes('auto-merged')) continue;
    const issue = await boothRequest(pull);
    if (issue?.user.login.toLowerCase() !== owner) continue;
    const at = new Date(pull.merged_at);
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

async function gate(pull: Pull) {
  const issue = await boothRequest(pull);
  if (!issue) return;
  const owner = issue.user.login.toLowerCase();
  const sha = pull.head.sha;
  const [files, booth, checks, review, all] = await Promise.all([
    changedFiles(pull),
    boothFiles(sha, owner),
    checkStates(sha),
    reviewState(pull),
    comments(pull.number),
  ]);
  const facts: GateFacts = {
    owner,
    accepted: names(issue.labels).includes('tessl'),
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
    lastAutoMerge: await lastAutoMerge(owner),
    now: new Date(),
  };
  const result = evaluateGate(facts);
  console.log(`#${pull.number} (booth ${owner}, ${sha.slice(0, 7)}): ${result.decision}`);
  await upsertComment(pull.number, all, gateComment(result, GUIDE));

  if (result.decision === 'human' && !facts.labels.includes('needs-human')) {
    if (!dryRun) await call('POST', `issues/${pull.number}/labels`, { labels: ['needs-human'] });
  }
  if (result.decision !== 'merge' || dryRun) return;
  // The sha pins the merge to the commit every check ran on: a push since then fails it.
  await call('PUT', `pulls/${pull.number}/merge`, { merge_method: 'merge', sha });
  await call('POST', `issues/${pull.number}/labels`, { labels: ['auto-merged'] });
  // A merge by this workflow's token starts no push workflows, so publish the map directly.
  await call('POST', 'actions/workflows/pages.yml/dispatches', { ref: 'main' });
  console.log(`#${pull.number}: merged`);
}

const pulls = await get<Pull[]>('pulls?state=open&per_page=100');
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
