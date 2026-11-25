/**
 * Runs the auto-merge gate on one factory pull request: gathers its facts,
 * keeps its checklist comment up to date, holds it for a person on the gate's
 * own failures, and merges it only when `evaluateGate` says so. The API client
 * is passed in, so the tests run it against a scripted one; the entry point is
 * scripts/auto-merge-booths.ts.
 */
import { evaluateGate } from './booth-gate.ts';
import { gateComment } from './gate-comment.ts';
import { gatherFacts } from './gate-facts.ts';
import { getAll, squareRequest, type Comment, type GitHub, type Pull } from './gate-github.ts';
import { landedNote } from './gate-request.ts';

const FACTORY = 'tessl-app[bot]';
/** Gate steps whose failure is labelled by someone else: the risk check, or a maintainer. */
const LABELLED_ELSEWHERE = new Set(['Risk and taste check', 'No one has asked to hold it']);

/** What one pull request's turn through the gate did, for publishing the map after. */
export interface GateOutcome {
  /** It merged, so the map is behind. */
  merged: boolean;
  /** It carries needs-human, which puts its construction site at "Waiting for a maintainer". */
  held: boolean;
}

async function upsertComment(github: GitHub, number: number, existing: Comment[], body: string) {
  const mine = existing.find(
    (c) => c.user.login === 'github-actions[bot]' && c.body.startsWith('<!-- booth-gate -->'),
  );
  if (mine?.body === body) return;
  if (github.dryRun) {
    console.log(`#${number}: would ${mine ? 'update' : 'post'} the checklist`);
    return;
  }
  if (mine) await github.call('PATCH', `issues/comments/${mine.id}`, { body });
  else await github.call('POST', `issues/${number}/comments`, { body });
}

/** Takes one factory pull request through the gate; `guide` is the page explaining it. */
export async function gatePull(
  github: GitHub,
  pull: Pull,
  guide: string,
  now = new Date(),
): Promise<GateOutcome> {
  const outcome: GateOutcome = { merged: false, held: false };
  const issue = await squareRequest(github, pull);
  if (!issue) return outcome;
  const { facts, comments } = await gatherFacts(github, pull, issue, now);
  const { kind, owner } = facts;
  const { number } = pull;
  const sha = pull.head.sha;
  const result = evaluateGate(facts);
  console.log(`#${number} (${kind} ${owner ?? ''}, ${sha.slice(0, 7)}): ${result.decision}`);
  await upsertComment(github, number, comments, gateComment(result, guide, kind));

  // Label only the gate's own deterministic failures. The risk check labels its
  // own verdicts, and a maintainer removing the label is asking it to look
  // again, so the gate mustn't put the label straight back over that.
  const ownFailures = result.steps.filter(
    (step) => step.hard && step.state === 'fail' && !LABELLED_ELSEWHERE.has(step.name),
  );
  if (ownFailures.length && !facts.labels.includes('needs-human') && !github.dryRun) {
    await github.call('POST', `issues/${number}/labels`, { labels: ['needs-human'] });
    outcome.held = true;
  }
  if (facts.labels.includes('needs-human')) outcome.held = true;
  if (result.decision !== 'merge' || github.dryRun) return outcome;
  // Label first, so the merge counts for the rate limit and the digest even if
  // a later step fails; take the label off again if the merge doesn't happen.
  await github.call('POST', `issues/${number}/labels`, { labels: ['auto-merged'] });
  try {
    // The sha pins the merge to the commit every check ran on: a push since then fails it.
    await github.call('PUT', `pulls/${number}/merge`, { merge_method: 'merge', sha });
  } catch (error) {
    // The merge may have happened even if its reply was lost: only take the
    // label off when the pull request really isn't merged.
    const after = await github.call<Pull>('GET', `pulls/${number}`).catch(() => undefined);
    if (after?.merged_at) {
      console.log(`#${number}: merged (its reply was lost)`);
      return { ...outcome, merged: true };
    }
    if (after)
      await github.call('DELETE', `issues/${number}/labels/auto-merged`).catch(() => undefined);
    throw error;
  }
  outcome.merged = true;
  console.log(`#${number}: merged`);
  // A merge by this workflow's token doesn't close the linked issue, so close
  // the request here, with a note on how it got onto the map.
  await github.call('POST', `issues/${issue.number}/comments`, {
    body: landedNote(kind, number, guide),
  });
  await github.call('PATCH', `issues/${issue.number}`, {
    state: 'closed',
    state_reason: 'completed',
  });
  return outcome;
}

/**
 * Takes every open factory pull request, from a `tessl/` branch of this
 * repository, through the gate. One that fails to go through is logged and
 * counted, and the rest still go.
 */
export async function gateOpenPulls(github: GitHub, guide: string) {
  const run = { merged: false, held: new Set<number>(), failed: false };
  for (const pull of await getAll<Pull>(github, 'pulls?state=open')) {
    const fromFactory =
      pull.user.login === FACTORY &&
      pull.head.ref.startsWith('tessl/') &&
      pull.head.repo?.full_name === github.repository;
    if (!fromFactory) continue;
    try {
      const outcome = await gatePull(github, pull, guide);
      run.merged ||= outcome.merged;
      if (outcome.held) run.held.add(pull.number);
    } catch (error) {
      console.error(`#${pull.number}: ${String(error)}`);
      run.failed = true;
    }
  }
  return run;
}
