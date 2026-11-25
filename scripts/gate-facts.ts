/**
 * Gathers the auto-merge gate's facts about one factory pull request from
 * GitHub: its changed files, its booth's or level's folder at the head commit,
 * its checks, its review and its risk verdict. The API client is passed in,
 * so the tests run it against a scripted one. Files are read as text through
 * the API; nothing of the pull request is checked out or run.
 */
import { ownFolder, type CheckState, type GateFacts } from './booth-gate.ts';
import { folderCodeProblems, mergesWithoutPerson, requestKind } from './gate-request.ts';
import {
  getAll,
  lastAutoMerge,
  names,
  type Comment,
  type GitHub,
  type Issue,
  type Pull,
  type User,
} from './gate-github.ts';
import { injectionMarkers, scanParticipantText } from './injection-scan.ts';
import type { CodeProblem, SourceFile } from './square-code.ts';

const FACTORY = 'tessl-app[bot]';
const REVIEWER = 'tessl-reviewer[bot]';
/** Limits on what the gate reads and compiles, checked from the tree before any file is loaded. */
const MAX_FILES = 40;
const MAX_FILE_BYTES = 100 * 1024;
const MAX_TOTAL_BYTES = 300 * 1024;

type ChangedFile = { filename: string; status: string; previous_filename?: string };
type TreeEntry = { path: string; type: string; sha: string; mode: string; size?: number };

const problem = (file: string, message: string): CodeProblem => ({
  file,
  line: 0,
  rule: 'files',
  message,
});

/**
 * Every file in the booth's or level's folder at the head commit, read as
 * text, plus any problem with what the folder holds. Sizes are checked from
 * the tree first, so an oversized one goes to a person without being loaded.
 */
async function folderFiles(
  github: GitHub,
  sha: string,
  kind: GateFacts['kind'],
  folder: string,
): Promise<{ files: SourceFile[]; problems: CodeProblem[] }> {
  const tree = await github.call<{ tree: TreeEntry[]; truncated: boolean }>(
    'GET',
    `git/trees/${sha}?recursive=1`,
  );
  const files: SourceFile[] = [];
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
    if (!mergesWithoutPerson(kind, folder, entry.path, entry.mode)) {
      problems.push(
        problem(entry.path, 'Only .ts and .md files, and a booth’s plot.json, merge on their own.'),
      );
      continue;
    }
    const blob = await github.call<{ content: string }>('GET', `git/blobs/${entry.sha}`);
    files.push({ path: entry.path, text: Buffer.from(blob.content, 'base64').toString('utf8') });
  }
  return { files, problems };
}

/** Each check's state on the commit, from its latest run by name. */
async function checkStates(github: GitHub, sha: string): Promise<Record<string, CheckState>> {
  type Run = { name: string; status: string; conclusion: string | null; started_at: string };
  const runs: Run[] = [];
  for (let page = 1; ; page++) {
    const { check_runs } = await github.call<{ check_runs: Run[] }>(
      'GET',
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

async function reviewState(github: GitHub, pull: Pull): Promise<GateFacts['review']> {
  const reviews = await getAll<{ user: User; commit_id: string; body: string }>(
    github,
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

/** The gate's facts about a pull request for `issue`, and the comments already on it. */
export async function gatherFacts(
  github: GitHub,
  pull: Pull,
  issue: Issue,
  now: Date,
): Promise<{ facts: GateFacts; comments: Comment[] }> {
  const owner = issue.user.login.toLowerCase();
  const kind = requestKind(names(issue.labels)) ?? 'booth';
  const folder = ownFolder(kind, owner);
  const sha = pull.head.sha;
  const changed = await getAll<ChangedFile>(github, `pulls/${pull.number}/files`);
  const files = changed.flatMap((f) => [
    f.filename,
    ...(f.previous_filename ? [f.previous_filename] : []),
  ]);
  // Only an open request counts: accepting a newer one closes the older, so a
  // superseded request's pull request never merges on its own.
  const accepted = issue.state === 'open' && names(issue.labels).includes('tessl');
  const inScope = files.length > 0 && files.every((f) => f.startsWith(folder));
  // Only read and compile the booth or level when the cheap checks already pass.
  const own =
    accepted && inScope
      ? await folderFiles(github, sha, kind, folder)
      : { files: [], problems: [] };
  const [checks, review, comments] = await Promise.all([
    checkStates(github, sha),
    reviewState(github, pull),
    getAll<Comment>(github, `issues/${pull.number}/comments`),
  ]);
  const facts: GateFacts = {
    kind,
    owner,
    accepted,
    changedFiles: files,
    codeProblems: [...own.problems, ...folderCodeProblems(kind, folder, changed, own.files)],
    textFindings: [
      ...scanParticipantText(`${issue.title}\n${issue.body ?? ''}`),
      ...injectionMarkers(pull.title),
    ],
    checks,
    review,
    risk: riskVerdict(comments, sha),
    labels: names(pull.labels),
    lastAutoMerge: await lastAutoMerge(github, owner, now),
    now,
  };
  return { facts, comments };
}
