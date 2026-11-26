/**
 * Gathers the facts the merge gate decides on (`GateFacts` in
 * scripts/booth-gate.ts) for one factory pull request, all on its head
 * commit: the request, the changed files, the booth's code, the checks, the
 * review and the risk verdict.
 */
import type { CheckState, GateFacts } from './booth-gate.ts';
import { injectionMarkers, scanParticipantText } from './injection-scan.ts';
import { boothFiles } from './merge-gate-booth-files.ts';
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
import { checkSquareCode, spotFileProblems } from './square-code.ts';

export const FACTORY = 'tessl-app[bot]';
const REVIEWER = 'tessl-reviewer[bot]';

type ChangedFile = { filename: string; status: string; previous_filename?: string };
type Run = { name: string; status: string; conclusion: string | null; started_at: string };

/**
 * Each check's state on `sha`, from the latest run of that name that ran. A
 * skipped run, such as CI starting again for a label it has no job for, says
 * nothing about the commit, so it counts only when no run of that name ran.
 */
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
    const skipped = (r: Run) => r.conclusion === 'skipped';
    const newer = !seen || run.started_at > seen.started_at;
    if (!seen || (skipped(seen) && !skipped(run)) || (newer && !skipped(run)))
      latest.set(run.name, run);
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

/** The facts about `pull`, built from booth request `issue`, and the comments on it. */
export async function gatherFacts(
  github: GitHub,
  pull: Pull,
  issue: Issue,
): Promise<{ facts: GateFacts; comments: Comment[] }> {
  const owner = issue.user.login.toLowerCase();
  const sha = pull.head.sha;
  const changed = await getAll<ChangedFile>(github, `pulls/${String(pull.number)}/files`);
  const files = changed.flatMap((f) => [
    f.filename,
    ...(f.previous_filename ? [f.previous_filename] : []),
  ]);
  // Only an open request counts: accepting a newer one closes the older, so a
  // superseded request's pull request never merges on its own.
  const accepted = issue.state === 'open' && names(issue.labels).includes('tessl');
  const inScope = files.length > 0 && files.every((f) => f.startsWith(`carnival/booths/${owner}/`));
  // Only read and compile the booth when the cheap checks already pass.
  const booth =
    accepted && inScope ? await boothFiles(github, sha, owner) : { files: [], problems: [] };
  const [checks, review, comments] = await Promise.all([
    checkStates(github, sha),
    reviewState(github, pull),
    getAll<Comment>(github, `issues/${String(pull.number)}/comments`),
  ]);
  const facts: GateFacts = {
    owner,
    accepted,
    changedFiles: files,
    codeProblems: [
      ...booth.problems,
      ...spotFileProblems(`carnival/booths/${owner}/`, changed),
      ...checkSquareCode(`carnival/booths/${owner}/`, booth.files),
    ],
    textFindings: [
      ...scanParticipantText(`${issue.title}\n${issue.body ?? ''}`),
      ...injectionMarkers(pull.title),
    ],
    checks,
    review,
    risk: riskVerdict(comments, sha),
    labels: names(pull.labels),
  };
  return { facts, comments };
}
