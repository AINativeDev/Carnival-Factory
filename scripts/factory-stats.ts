/**
 * How much the factory has built, for the `#/factory` page: its pull
 * requests, the booth requests and what came of them, the review findings,
 * and how long a request takes to reach the map. Worked out from the same
 * issues and pull requests as every square's history
 * (scripts/write-square-history.ts reads them), in plain functions so the
 * counting is tested.
 *
 * Only numbers and dates come out: no titles, bodies, logins or links, so
 * nothing a participant wrote reaches the page through it.
 */
import {
  REQUEST_LABEL,
  branchIssue,
  countFindings,
  decisionOf,
  type RawIssue,
  type RawPull,
} from './github-requests.ts';

/** The label that hands an issue to the factory: the moment it carries it, the request is accepted. */
export const ACCEPTED_LABEL = 'tessl';
/** The label scripts/auto-merge-booths.ts puts on a pull request it merged on its own. */
export const AUTO_MERGED_LABEL = 'auto-merged';

/** The factory's numbers, as the build writes them. */
export interface FactoryStats {
  /** Pull requests the factory opened, from a `tessl/…` branch, and how they went. */
  builds: number;
  merged: number;
  /** Merged on their own, by the booth gate; the rest of `merged` a maintainer merged. */
  autoMerged: number;
  /** Booth requests filed, and what the assessment decided. */
  requests: number;
  accepted: number;
  question: number;
  declined: number;
  /** Review findings raised across the factory's pull requests, and how many were fixed. */
  findings: number;
  fixed: number;
  /**
   * Minutes from a booth request being accepted to its pull request merging,
   * over the requests that merged: the fastest and the median. Absent when none has.
   */
  toMap?: { fastest: number; median: number; count: number };
  /** ISO time the build read them. */
  readAt: string;
}

/** Whether a pull request is one the factory opened: from a `tessl/…` branch of this repository. */
export const isFactoryPull = (pull: RawPull) =>
  !pull.isCrossRepository && pull.headRefName.startsWith('tessl/');

/** When the issue first got `label`, or undefined if its timeline never shows it. */
export function labelledAt(issue: RawIssue, label: string = ACCEPTED_LABEL): string | undefined {
  // Stryker disable next-line ArrayDeclaration: anything made up in place of no timeline has no label, so nothing is kept.
  const times = (issue.timelineItems?.nodes ?? [])
    .filter((event) => event.label?.name === label && !Number.isNaN(Date.parse(event.createdAt)))
    .map((event) => event.createdAt)
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  return times[0];
}

/** The middle value of some numbers, or the mean of the middle two. */
export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Minutes from each booth request's acceptance to the first of its factory
 * pull requests to merge after it, for the requests that got that far.
 */
export function minutesToMap(issues: RawIssue[], pulls: RawPull[]): number[] {
  const merges = new Map<number, number[]>();
  for (const pull of pulls) {
    const issue = branchIssue(pull.headRefName);
    const merged = pull.mergedAt ? Date.parse(pull.mergedAt) : NaN;
    // Stryker disable next-line ConditionalExpression: merges kept under no issue are never looked up, since every issue has a number.
    if (issue === undefined || pull.isCrossRepository || Number.isNaN(merged)) continue;
    // Stryker disable next-line ArrayDeclaration: a made-up first merge is no time, and no time is after an acceptance.
    merges.set(issue, [...(merges.get(issue) ?? []), merged]);
  }
  const minutes: number[] = [];
  for (const issue of issues) {
    if (!issue.labels.nodes.some((label) => label.name === REQUEST_LABEL)) continue;
    const accepted = labelledAt(issue);
    // Stryker disable next-line ConditionalExpression: with no acceptance the start is NaN, and no merge comes after NaN.
    if (!accepted) continue;
    const from = Date.parse(accepted);
    // Stryker disable next-line ArrayDeclaration: a made-up merge is no time, and no time is after an acceptance.
    const after = (merges.get(issue.number) ?? []).filter((time) => time >= from);
    if (after.length) minutes.push(Math.round((Math.min(...after) - from) / 60_000));
  }
  return minutes;
}

/** The factory's numbers, from the repository's issues and pull requests. */
export function factoryStats(issues: RawIssue[], pulls: RawPull[], readAt: string): FactoryStats {
  const factory = pulls.filter(isFactoryPull);
  const merged = factory.filter((pull) => pull.state === 'MERGED');
  // A branch that names no issue adds `undefined`, which no request's number matches.
  const built = new Set(factory.map((pull) => branchIssue(pull.headRefName)));
  const requests = issues.filter((issue) =>
    issue.labels.nodes.some((label) => label.name === REQUEST_LABEL),
  );
  const decisions = requests.map((issue) =>
    decisionOf(
      issue.labels.nodes.map((label) => label.name),
      built.has(issue.number),
    ),
  );
  const findings = factory.map((pull) => countFindings(pull));
  const minutes = minutesToMap(issues, pulls);

  const stats: FactoryStats = {
    builds: factory.length,
    merged: merged.length,
    autoMerged: merged.filter((pull) =>
      // Stryker disable next-line ArrayDeclaration: anything made up in place of no labels is no label at all.
      (pull.labels?.nodes ?? []).some((label) => label.name === AUTO_MERGED_LABEL),
    ).length,
    requests: requests.length,
    accepted: decisions.filter((d) => d === 'accepted').length,
    question: decisions.filter((d) => d === 'question').length,
    declined: decisions.filter((d) => d === 'declined').length,
    findings: findings.reduce((sum, f) => sum + f.findings, 0),
    fixed: findings.reduce((sum, f) => sum + f.fixed, 0),
    readAt,
  };
  if (minutes.length) {
    stats.toMap = {
      fastest: Math.min(...minutes),
      median: Math.round(median(minutes)),
      count: minutes.length,
    };
  }
  return stats;
}
