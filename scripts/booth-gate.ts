/**
 * The auto-merge gate for a factory pull request that changes one booth, or
 * one participant's level (ADR 0043).
 * Given the facts about a pull request, it decides whether it merges on its
 * own, waits for something still running, or needs a person. Plain functions,
 * so the rules can be tested without GitHub; `auto-merge-booths.ts` gathers
 * the facts and acts on the decision.
 *
 * The rule of thumb: every check must pass on the pull request's current head
 * commit, and any doubt sends it to a person.
 */
import { isNorthPoleLevel } from '../src/northpole/north-pole-levels.ts';
import type { CodeProblem } from './square-code.ts';
import type { TextFinding } from './injection-scan.ts';

/** The checks that must pass on the head commit before anything merges. */
export const REQUIRED_CHECKS = ['check', 'ownership', 'build', 'smoke'] as const;

export type CheckState = 'success' | 'failure' | 'pending' | 'missing';
export type Verdict = 'low-risk' | 'needs-human';
/** What a request builds: a participant's booth, or their level. */
export type RequestKind = 'booth' | 'level';

export interface GateFacts {
  /** Whether the request is for a booth or a level, from its label. */
  kind: RequestKind;
  /** The participant the booth or level belongs to: the author of the request issue, in lower case. */
  owner: string | undefined;
  /** The issue was accepted by the assessment: it carries `booth-request` or `level-request`, and `tessl`. */
  accepted: boolean;
  /** Every file the pull request changes. */
  changedFiles: string[];
  /** The deterministic code check on the booth's or level's folder at the head commit. */
  codeProblems: CodeProblem[];
  /** Injection or hidden text in the issue's title and body, and the pull request's title. */
  textFindings: TextFinding[];
  /** Each required check's state on the head commit. */
  checks: Record<string, CheckState>;
  /** The Tessl Reviewer's result on the head commit: approved, not approved, or not in yet. */
  review: 'approved' | 'changes' | 'pending';
  /** The risk assessment's verdict on the head commit, if it has given one. */
  risk: Verdict | undefined;
  /** Labels on the pull request. */
  labels: string[];
}

export interface GateStep {
  name: string;
  state: 'pass' | 'wait' | 'fail';
  /**
   * A hard step failing means a person must look. A soft one, like a failed
   * test or a review asking for changes, is something the factory's shepherd
   * fixes on its own, so the gate waits for it instead.
   */
  hard: boolean;
  /** What the step checks, in words a participant can follow. */
  about: string;
  detail?: string;
}

export interface GateDecision {
  decision: 'merge' | 'wait' | 'human';
  steps: GateStep[];
}

/** How the smoke test plays each kind of request in CI. */
const PLAYED = {
  booth: 'plays the booth in its sandbox',
  level: 'walks the level and plays each of its squares in its sandbox',
};

/**
 * Why the owner's folder can't merge on its own however it's changed: the
 * North Pole's own levels are maintainers' only (ADR 0043), even when a login
 * matches one.
 */
const keptForMaintainers = (kind: RequestKind, owner: string | undefined) =>
  kind === 'level' && !!owner && isNorthPoleLevel(owner)
    ? 'The North Pole’s own levels merge only with a maintainer.'
    : undefined;

/** Decides what happens to a factory pull request for a booth or a level. */
export function evaluateGate(facts: GateFacts): GateDecision {
  const { kind } = facts;
  const steps: GateStep[] = [];
  const add = (
    name: string,
    about: string,
    state: GateStep['state'],
    detail?: string,
    hard = true,
  ) => steps.push({ name, about, state, hard, detail });

  add(
    'Request accepted',
    `The assessment read the request and found it a sane change to its author’s own ${kind}.`,
    facts.owner && facts.accepted ? 'pass' : 'fail',
    facts.owner ? undefined : 'The pull request doesn’t link to a request issue by a person.',
  );

  const folder = `carnival/${kind}s/${facts.owner ?? ''}/`;
  const outside = facts.owner
    ? facts.changedFiles.filter((file) => !file.startsWith(folder))
    : facts.changedFiles;
  const reserved = keptForMaintainers(kind, facts.owner);
  add(
    `Only the ${kind}’s own folder`,
    `Every changed file is inside carnival/${kind}s/<owner>/, so nothing else on the map can change.`,
    outside.length === 0 && facts.changedFiles.length > 0 && !reserved ? 'pass' : 'fail',
    outside.length ? `Also changes ${outside.slice(0, 5).join(', ')}` : reserved,
  );

  add(
    'Code stays in its square',
    `A static check reads the code’s syntax and types, without running it, and finds nothing that could reach outside the ${kind}.`,
    facts.codeProblems.length === 0 ? 'pass' : 'fail',
    facts.codeProblems
      .slice(0, 5)
      .map((p) => `${p.file}:${p.line} ${p.message}`)
      .join('; ') || undefined,
  );

  add(
    'No hidden instructions',
    'The request and the code are scanned for text aimed at an AI, hidden characters or encoded blobs.',
    facts.textFindings.length === 0 ? 'pass' : 'fail',
    facts.textFindings
      .slice(0, 3)
      .map((f) => f.what)
      .join('; ') || undefined,
  );

  const pending = REQUIRED_CHECKS.filter((name) => (facts.checks[name] ?? 'missing') !== 'success');
  const failed = pending.filter((name) => facts.checks[name] === 'failure');
  add(
    'Checks pass',
    `Lint, types, tests, the size budget, ownership, a build, and a smoke test that ${PLAYED[kind]}.`,
    failed.length ? 'fail' : pending.length ? 'wait' : 'pass',
    pending.length
      ? `${failed.length ? 'Failed' : 'Waiting for'}: ${pending.join(', ')}`
      : undefined,
    false,
  );

  add(
    'Code review approves',
    'Tessl Code Review reviews the change, including a house-rules lens, and approves it with nothing left to fix.',
    facts.review === 'approved' ? 'pass' : facts.review === 'pending' ? 'wait' : 'fail',
    facts.review === 'changes' ? 'The factory is answering the review.' : undefined,
    false,
  );

  add(
    'Risk and taste check',
    'An agent looks at the change and its screenshots for anything unkind, copied or unsafe, and for tricks the other checks could miss.',
    facts.risk === 'low-risk' ? 'pass' : facts.risk === 'needs-human' ? 'fail' : 'wait',
  );

  const flagged = facts.labels.includes('needs-human');
  add(
    'No one has asked to hold it',
    'A maintainer, or any check above, can hold a pull request for a person with the needs-human label.',
    flagged ? 'fail' : 'pass',
  );

  const decision = steps.some((s) => s.hard && s.state === 'fail')
    ? 'human'
    : steps.some((s) => s.state !== 'pass')
      ? 'wait'
      : 'merge';
  return { decision, steps };
}
