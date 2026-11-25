import type {
  Credits,
  Decision,
  HistoryKind,
  HistoryPull,
  SquareHistory,
} from '../scripts/square-history';

/**
 * Every square's history, read from the repository when the site was built
 * (scripts/write-square-history.ts) and bundled into the page, so showing it
 * never reaches the network. A build without the file, such as a preview or
 * `npm run dev`, has no history.
 */
const files = import.meta.glob<SquareHistory>('../square-history.json', {
  eager: true,
  import: 'default',
});
export const SQUARE_HISTORY: SquareHistory | undefined = Object.values(files)[0];

/** A square's requests, newest first; empty when the build has none. */
export const historyOf = (data: SquareHistory | undefined, kind: HistoryKind, id: string) =>
  data?.squares[`${kind}/${id.toLowerCase()}`] ?? [];

/**
 * Who made a square and who improved it since, from the build's history. A
 * booth the factory never built into, or a build without the file, credits
 * its owner; an attraction then credits nobody.
 */
export function creditsFor(
  data: SquareHistory | undefined,
  kind: HistoryKind,
  id: string,
): Credits | undefined {
  const credits = data?.credits?.[`${kind}/${id.toLowerCase()}`];
  if (credits) return credits;
  return kind === 'booth' ? { maker: id, improvers: [] } : undefined;
}

/** What the panel says when a square has no requests to show. */
export const emptyHistoryText = (data: SquareHistory | undefined) =>
  data
    ? 'No requests for this square are on record in this build.'
    : 'Timelines appear once this is on the live map.';

/** What the assessment decided, in words. */
const DECISIONS: Record<Decision, string> = {
  accepted: 'Accepted',
  question: 'Asked a question',
  declined: 'Declined',
  waiting: 'Waiting for the assessment',
};

/** A day, such as "24 Nov 2026", the same wherever the visitor is. */
export function day(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** How a pull request went: its review findings, how many were fixed, and its commits. */
export function pullSummary(pull: HistoryPull): string {
  const parts = [
    pull.findings
      ? `${count(pull.findings, 'review finding')}, ${pull.fixed} fixed`
      : 'no review findings',
    count(pull.commits, 'commit'),
  ];
  return parts.join(', ');
}

/** Where a pull request stands: merged on a day, open, or closed without merging. */
export function pullState(pull: HistoryPull): string {
  if (pull.state === 'merged') return pull.mergedAt ? `Merged ${day(pull.mergedAt)}` : 'Merged';
  return pull.state === 'open' ? 'Open' : 'Closed without merging';
}

/** What the assessment decided about a request, in words. */
export const decisionText = (decision: Decision) => DECISIONS[decision];

/** Only https links: the data is the build's own, but its links never run script. */
export const safeHref = (href: string) => (/^https:\/\//i.test(href) ? href : '#');
