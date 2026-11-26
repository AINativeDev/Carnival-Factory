/**
 * One round of the auto-merge gate (docs/specs/auto-merge-gate.md): for each
 * open factory pull request built from a booth request, gather the facts,
 * decide with `evaluateGate`, keep the checklist comment up to date, and merge
 * only when every step passes. Then publish the map if it's behind.
 */
import { SETTINGS } from '../src/settings.ts';
import { evaluateGate, gateComment } from './booth-gate.ts';
import { closeRequest, holdForPerson, mergePull, upsertChecklist } from './merge-gate-actions.ts';
import { holdsForPerson } from './merge-gate-decision.ts';
import { FACTORY, gatherFacts } from './merge-gate-facts.ts';
import { getAll, type GitHub, type Pull } from './merge-gate-github.ts';
import { publishIfBehind } from './merge-gate-publish.ts';
import { boothRequest } from './merge-gate-requests.ts';

interface Round {
  github: GitHub;
  repository: string;
  dryRun: boolean;
  guide: string;
  /** Whether this round merged a booth. */
  merged: boolean;
  /** Factory pull requests with needs-human, which puts their booth's site at "Waiting for a maintainer". */
  held: Set<number>;
}

async function gate(round: Round, pull: Pull) {
  const { github, repository, dryRun } = round;
  const issue = await boothRequest(github, repository, pull);
  if (!issue) return;
  const sha = pull.head.sha;
  const { facts, comments } = await gatherFacts(github, pull, issue);
  const result = evaluateGate(facts);
  console.log(
    `#${String(pull.number)} (booth ${String(facts.owner)}, ${sha.slice(0, 7)}): ${result.decision}`,
  );
  await upsertChecklist(github, pull.number, comments, gateComment(result, round.guide), dryRun);

  if (holdsForPerson(result, facts.labels) && !dryRun) {
    await holdForPerson(github, pull.number);
    round.held.add(pull.number);
  }
  if (facts.labels.includes('needs-human')) round.held.add(pull.number);
  if (result.decision !== 'merge' || dryRun) return;
  const closes = await mergePull(github, pull, sha);
  round.merged = true;
  if (closes) await closeRequest(github, issue, pull, round.guide);
}

/**
 * Gates every open factory pull request in `repository` through `github`.
 * Returns false when any of them failed; the others are still gated, and the
 * map still published.
 */
export async function runMergeGate(
  github: GitHub,
  { repository, dryRun }: { repository: string; dryRun: boolean },
): Promise<boolean> {
  const round: Round = {
    github,
    repository,
    dryRun,
    guide: `${SETTINGS.github.web}/${repository}/blob/main/docs/how-it-works.md`,
    merged: false,
    held: new Set(),
  };
  let ok = true;
  for (const pull of await getAll<Pull>(github, 'pulls?state=open')) {
    const fromFactory =
      pull.user.login === FACTORY &&
      pull.head.ref.startsWith('tessl/') &&
      pull.head.repo?.full_name === repository;
    if (!fromFactory) continue;
    try {
      await gate(round, pull);
    } catch (error) {
      console.error(`#${String(pull.number)}: ${String(error)}`);
      ok = false;
    }
  }
  const published = await publishIfBehind(github, round);
  return ok && published;
}
