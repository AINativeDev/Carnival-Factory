import { profileUrl } from '../northpole/links';
import type {
  Credits,
  Decision,
  HistoryEntry,
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

/** "a", "a and b", "a, b and c". */
const listed = <T, S>(items: T[], and: S, comma: S): (T | S)[] =>
  items.flatMap((item, n) => (n === 0 ? [item] : [n === items.length - 1 ? and : comma, item]));

/**
 * Fills `line` with a square's credits, "Made by @a. Improved by @b and @c.",
 * or only who improved an attraction, each login set as text and linked to
 * its GitHub profile.
 */
export function renderCredits(line: HTMLElement, credits: Credits) {
  const person = (login: string): Node => {
    const url = profileUrl(login);
    if (!url) return document.createTextNode(`@${login}`);
    const a = document.createElement('a');
    a.className = 'visit-person';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = `@${login}`;
    return a;
  };
  const parts: (Node | string)[] = [];
  if (credits.maker) parts.push('Made by ', person(credits.maker), '.');
  if (credits.improvers.length) {
    if (parts.length) parts.push(' ');
    parts.push('Improved by ', ...listed(credits.improvers.map(person), ' and ', ', '), '.');
  }
  line.replaceChildren(...parts);
}

/** What the panel says when a square has no requests to show. */
export const emptyHistoryText = (data: SquareHistory | undefined) =>
  data
    ? 'No requests for this square are on record in this build.'
    : 'Timelines appear once this is on the live map.';

/** What the assessment decided, in words. */
export const DECISIONS: Record<Decision, string> = {
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

/** One request's line under its title: who asked, when, and what was decided. */
export const requestLine = (entry: HistoryEntry) =>
  `@${entry.author} · ${day(entry.openedAt)} · ${DECISIONS[entry.decision]}`;

/**
 * Fills `list` with a square's timeline, every piece of text set as text and
 * every link to GitHub or this site's own previews.
 */
export function renderHistory(list: HTMLElement, entries: HistoryEntry[]) {
  list.replaceChildren();
  const link = (href: string, text: string, className: string) => {
    const a = document.createElement('a');
    a.className = className;
    a.href = safeHref(href);
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = text;
    return a;
  };
  const line = (className: string, ...parts: (Node | string)[]) => {
    const p = document.createElement('p');
    p.className = className;
    p.append(...parts);
    return p;
  };
  for (const entry of entries) {
    const item = document.createElement('li');
    item.className = 'history-entry';
    item.dataset.decision = entry.decision;
    item.append(
      line('history-request', link(entry.url, `#${entry.issue} ${entry.title}`, 'history-issue')),
      line('history-meta', requestLine(entry)),
    );
    for (const pull of entry.pulls) {
      const parts: (Node | string)[] = [
        link(pull.url, `Pull request #${pull.number}`, 'history-pull'),
        ` · ${pullState(pull)} · ${pullSummary(pull)}`,
      ];
      if (pull.preview) parts.push(' · ', link(pull.preview, 'Preview it', 'history-preview'));
      item.append(line('history-pr', ...parts));
    }
    list.append(item);
  }
}

/** Only https links: the data is the build's own, but its links never run script. */
export const safeHref = (href: string) => (/^https:\/\//i.test(href) ? href : '#');
