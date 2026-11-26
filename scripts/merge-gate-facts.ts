/**
 * Gathers the facts the merge gate decides on (`GateFacts` in
 * scripts/booth-gate.ts) for one factory pull request, all on its head
 * commit: the request, the changed files, the booth's or level's code, the
 * checks, the review and the risk verdict.
 */
import type { CheckState, GateFacts } from './booth-gate.ts';
import { injectionMarkers, scanParticipantText } from './injection-scan.ts';
import { checkLevelCode } from './level-code.ts';
import { folderFiles } from './merge-gate-folder-files.ts';
import {
  get,
  getAll,
  names,
  type Comment,
  type GitHub,
  type Issue,
  type Pull,
  type User,
} from './merge-gate-github.ts';
import { lastAutoMerge, requestKind } from './merge-gate-requests.ts';
import { checkSquareCode, spotFileProblems } from './square-code.ts';

export const FACTORY = 'tessl-app[bot]';
const REVIEWER = 'tessl-reviewer[bot]';

type ChangedFile = { filename: string; status: string; previous_filename?: string };
type GateFiles = Awaited<ReturnType<typeof folderFiles>>;
type Run = { name: string; status: string; conclusion: string | null; started_at: string };

/** Each check's state on `sha`, from the latest run of that name. */
async function checkStates(github: GitHub, sha: string): Promise<Record<string, CheckState>> {
  const runs: Run[] = [];
  for (let page = 1; ; page++) {
    const { check_runs } = await get<{ check_runs: Run[] }>(
      github,
      `commits/${sha}/check-runs?per_page=100&page=${String(page)}`,
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
    `pulls/${String(pull.number)}/reviews`,
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

/**
 * The static check on a booth's or level's `files`: a booth is one square,
 * with its spot.json held to its first pull request; a level is plain data
 * with a square in each squares/<id>/ (scripts/level-code.ts).
 */
function codeProblems(folder: string, files: GateFiles, changed: ChangedFile[]) {
  if (folder.startsWith('carnival/levels/')) return checkLevelCode(folder, files.files);
  return [...spotFileProblems(folder, changed), ...checkSquareCode(folder, files.files)];
}

/** The facts about `pull`, built from booth or level request `issue`, and the comments on it. */
export async function gatherFacts(
  github: GitHub,
  repository: string,
  pull: Pull,
  issue: Issue,
  now: Date,
): Promise<{ facts: GateFacts; comments: Comment[] }> {
  const owner = issue.user.login.toLowerCase();
  const kind = requestKind(issue);
  const folder = `carnival/${kind}s/${owner}/`;
  const sha = pull.head.sha;
  const changed = await getAll<ChangedFile>(github, `pulls/${String(pull.number)}/files`);
  const files = changed.flatMap((f) => [
    f.filename,
    ...(f.previous_filename ? [f.previous_filename] : []),
  ]);
  // Only an open request counts: accepting a newer one closes the older, so a
  // superseded request's pull request never merges on its own.
  const accepted = issue.state === 'open' && names(issue.labels).includes('tessl');
  const inScope = files.length > 0 && files.every((f) => f.startsWith(folder));
  // Only read and compile the folder when the cheap checks already pass.
  const own: GateFiles =
    accepted && inScope ? await folderFiles(github, sha, folder) : { files: [], problems: [] };
  const [checks, review, comments] = await Promise.all([
    checkStates(github, sha),
    reviewState(github, pull),
    getAll<Comment>(github, `issues/${String(pull.number)}/comments`),
  ]);
  const facts: GateFacts = {
    kind,
    owner,
    accepted,
    changedFiles: files,
    codeProblems: [...own.problems, ...codeProblems(folder, own, changed)],
    textFindings: [
      ...scanParticipantText(`${issue.title}\n${issue.body ?? ''}`),
      ...injectionMarkers(pull.title),
    ],
    checks,
    review,
    risk: riskVerdict(comments, sha),
    labels: names(pull.labels),
    lastAutoMerge: await lastAutoMerge(github, repository, owner, now),
    now,
  };
  return { facts, comments };
}
