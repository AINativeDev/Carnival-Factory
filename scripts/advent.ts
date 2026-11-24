/**
 * The advent calendar's rules for its issues, as plain functions: reading an
 * Advent challenge form, deciding what can be checked from what GitHub says
 * about the link, the record an acceptance leaves on the issue, and the counts
 * the build reads from those records. scripts/check-advent.ts and
 * scripts/write-advent.ts do the GitHub calls; nothing here does.
 */
import { ADVENT_DAYS, cleanCounts, isDoorOpenAnywhere } from '../northpole/advent.ts';
import { isRepo } from '../northpole/badges.ts';
import { formField } from './elf-engineer.ts';
import { FACTORY_BOTS } from './ownership.ts';

/** The issue form's labels for its two fields, as the issue's body shows them. */
export const ADVENT_FIELDS = {
  day: 'Which day',
  link: 'Your pull request or issue',
};

/** The day the form names, from 1 to 24, as the dropdown writes it ("Day 5: ...") or a plain number. */
export function parseDay(text: string | undefined): number | undefined {
  const match = text?.trim().match(/^(?:day\s*)?(\d{1,2})(?::.*)?$/i);
  const day = match ? Number(match[1]) : NaN;
  return day >= 1 && day <= ADVENT_DAYS ? day : undefined;
}

/** A pull request's or an issue's repository and number, from its github.com address. */
export function parseAdventLink(
  text: string | undefined,
): { repo: string; kind: 'pull' | 'issue'; number: number } | undefined {
  const match = text
    ?.trim()
    .match(
      /^https?:\/\/(?:www\.)?github\.com\/([^/\s]+\/[^/\s]+)\/(pull|issues)\/(\d{1,9})(?:[/?#]\S*)?$/i,
    );
  if (!match || !isRepo(match[1])) return undefined;
  return {
    repo: match[1],
    kind: match[2].toLowerCase() === 'pull' ? 'pull' : 'issue',
    number: Number(match[3]),
  };
}

/**
 * The issue's title and body with the form's values taken out wherever they
 * parse, for the injection scan: a day and a link say nothing to an agent.
 */
export function adventFreeText(title: string, body: string): string {
  let text = `${title}\n${body.replace(/\r\n?/g, '\n')}`;
  const link = formField(body, ADVENT_FIELDS.link);
  const day = formField(body, ADVENT_FIELDS.day);
  if (link && parseAdventLink(link)) text = text.replaceAll(link, '');
  if (day && parseDay(day)) text = text.replaceAll(day, '');
  return text;
}

/** What GitHub says about an Advent challenge issue. Anything it couldn't find is undefined. */
export interface AdventFacts {
  /** The issue's author. */
  author: string;
  /** The day the form names, as written. */
  dayField?: string;
  /** The link the form names, as written. */
  linkField?: string;
  /** Whether `scanParticipantText` in scripts/injection-scan.ts found anything in the issue's `adventFreeText`. */
  flaggedText?: boolean;
  /** When the issue was opened. */
  openedAt: Date;
  /** The calendar's year. */
  year: number;
  /** The linked repository, when it's public. */
  repo?: { fullName: string; owner: string };
  /** Whether the author is a public member of the organisation that owns the repository. */
  authorIsMember?: boolean;
  /** The linked pull request or issue, as GitHub found it in that repository. */
  item?: { kind: 'pull' | 'issue'; number: number; author: string };
}

/**
 * What the script decides: `check` passes the request on to the skill, which
 * judges whether the link plausibly matches the day's challenge; a decline
 * ends it; `review` sends it to a maintainer.
 */
export type AdventDecision =
  | { check: true; day: number; repo: string; kind: 'pull' | 'issue'; number: number }
  | { check: false; reason: string; review?: true };

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * Passes a request on only when it names a day whose door had opened by the
 * time it was asked, and links a public pull request or issue on a repository
 * of the author's own, or that the author opened there. Text the injection
 * scan flags goes to a maintainer. Otherwise declines, with the first reason
 * that applies. A private repository is declined just like one GitHub can't
 * find, by the name the requester wrote.
 */
export function decideAdvent(facts: AdventFacts): AdventDecision {
  if (facts.flaggedText) {
    return { check: false, review: true, reason: 'a maintainer will look at this one' };
  }
  const day = parseDay(facts.dayField);
  if (!day) return { check: false, reason: 'the form needs the day, from 1 to 24' };
  if (!isDoorOpenAnywhere(day, facts.openedAt, facts.year)) {
    return { check: false, reason: `day ${day}'s door hadn't opened yet` };
  }
  const link = parseAdventLink(facts.linkField);
  if (!link) {
    return { check: false, reason: 'the form needs a link to a GitHub pull request or issue' };
  }
  const repo = facts.repo;
  if (!repo) return { check: false, reason: `${link.repo} isn't a public repository` };
  const item = facts.item;
  if (!item || item.number !== link.number || item.kind !== link.kind) {
    return {
      check: false,
      reason: `that ${link.kind === 'pull' ? 'pull request' : 'issue'} isn't in ${repo.fullName}`,
    };
  }
  if (
    !same(repo.owner, facts.author) &&
    !facts.authorIsMember &&
    !same(item.author, facts.author)
  ) {
    return { check: false, reason: `${repo.fullName} isn't yours, and you didn't open that one` };
  }
  return { check: true, day, repo: repo.fullName, kind: item.kind, number: item.number };
}

/** The start of every comment the assess-advent-challenge skill writes. */
export const ADVENT_MARKER = '<!-- assess-advent-challenge -->';

/** The line an accepting comment carries, which the build reads back. */
export const acceptMarker = (day: number) => `<!-- advent-done: ${day} -->`;

/** The day a comment accepts, if it carries a well-formed marker. */
export function readAccepted(body: string): number | undefined {
  const match = body.match(/<!-- advent-done: (\d{1,2}) -->/);
  const day = match ? Number(match[1]) : NaN;
  return day >= 1 && day <= ADVENT_DAYS ? day : undefined;
}

/** An Advent challenge issue as the GitHub API gives it, with its comments. */
export interface AdventRecord {
  issue: { number: number; user: { login: string }; labels?: { name: string }[] };
  comments: { user: { login: string; type: string }; body: string; created_at: string }[];
}

/**
 * How many challenges each participant has had accepted. Only acceptances the
 * Tessl App wrote count, each for the issue's author, and an issue counts only
 * by its latest decision, so one labelled `declined`, or accepted and then
 * declined, never counts. A day counts once however often it's marked done.
 */
export function adventCounts(records: readonly AdventRecord[]): Record<string, number> {
  const days = new Map<string, Set<number>>();
  for (const { issue, comments } of records) {
    if (issue.labels?.some((label) => label.name === 'declined')) continue;
    const decisions = comments
      .filter(
        (comment) =>
          comment.user.type === 'Bot' &&
          FACTORY_BOTS.includes(comment.user.login.toLowerCase()) &&
          comment.body.trimStart().startsWith(ADVENT_MARKER),
      )
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    const latest = decisions.at(-1);
    const day = latest && readAccepted(latest.body);
    if (!day) continue;
    const login = issue.user.login.toLowerCase();
    days.set(login, (days.get(login) ?? new Set()).add(day));
  }
  return cleanCounts(
    Object.fromEntries(
      [...days].sort(([a], [b]) => a.localeCompare(b)).map(([login, set]) => [login, set.size]),
    ),
  );
}
