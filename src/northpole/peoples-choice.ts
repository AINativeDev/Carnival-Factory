/**
 * People's Choice: visitors vote for their favourite booth, and for the best
 * home factory, with a 👍 on its comment in one pinned GitHub issue, the ballot
 * (docs/adr/0030-peoples-choice-on-an-issue.md). The site has
 * no server, so the deploy reads the votes (scripts/write-peoples-choice.ts)
 * and the build bakes the standings into the page, which never asks the network.
 */
/** The ballot's title: a maintainer opens the issue once, with exactly this title. */
export const BALLOT_TITLE = "People's Choice";

/** When voting closes. A 👍 given after it doesn't count. Maintainers can change it. */
export const VOTING_CLOSES = '2026-12-31T23:59:59Z';

/** The categories: booths on this map, and factories people built on their own repositories. */
export type ChoiceCategory = 'booth' | 'factory';

/** One entry in the standings: whose it is, its comment, and the votes that count. */
export interface ChoiceEntry {
  login: string;
  /** The comment to vote on. */
  url: string;
  votes: number;
  /** A home factory's repository, as `owner/name`. */
  repo?: string;
}

/** The standings, each category most votes first. */
export interface PeoplesChoice {
  /** The ballot's address: the issue where people vote. */
  ballot: string;
  booths: ChoiceEntry[];
  factories: ChoiceEntry[];
}

/** A GitHub login, in lower case, as a booth's folder is named. */
const LOGIN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/;
/** A repository as `owner/name`. */
const REPO = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}\/[A-Za-z0-9._-]{1,100}$/;

/**
 * Whether `url` is an issue, or a comment on one, in this repository: the only
 * links the standings may carry, since they come from JSON the deploy wrote.
 */
export function isBallotUrl(url: unknown, repoUrl: string): url is string {
  if (typeof url !== 'string' || url.length > 300) return false;
  const prefix = `${repoUrl}/issues/`;
  return url.startsWith(prefix) && /^\d+(?:#issuecomment-\d+)?$/.test(url.slice(prefix.length));
}

function cleanEntries(data: unknown, repoUrl: string, off: ReadonlySet<string>): ChoiceEntry[] {
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  const entries: ChoiceEntry[] = [];
  for (const item of data as unknown[]) {
    if (!item || typeof item !== 'object') continue;
    const { login, url, votes, repo } = item as Record<string, unknown>;
    if (typeof login !== 'string' || !LOGIN.test(login) || seen.has(login) || off.has(login))
      continue;
    if (!isBallotUrl(url, repoUrl)) continue;
    if (typeof votes !== 'number' || !Number.isInteger(votes) || votes < 0) continue;
    const entry: ChoiceEntry = { login, url, votes };
    if (typeof repo === 'string' && REPO.test(repo) && !/\/\.\.?$/.test(repo)) entry.repo = repo;
    seen.add(login);
    entries.push(entry);
  }
  return entries.sort((a, b) => b.votes - a.votes || a.login.localeCompare(b.login));
}

/**
 * The standings from untrusted JSON, or undefined without a ballot: only
 * well-formed entries with links into this repository's issues, and no
 * booth in `disabled`, the kill switch's list.
 */
export function cleanChoice(
  data: unknown,
  disabled: readonly string[],
  repoUrl: string,
): PeoplesChoice | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const { ballot, booths, factories } = data as Record<string, unknown>;
  if (!isBallotUrl(ballot, repoUrl) || ballot.includes('#')) return undefined;
  const off = new Set(disabled.map((login) => login.toLowerCase()));
  return {
    ballot,
    booths: cleanEntries(booths, repoUrl, off),
    factories: cleanEntries(factories, repoUrl, new Set()),
  };
}

/**
 * Each entry's place, 1 for the most votes, with ties sharing a place
 * (1, 1, 3). An entry without votes has no place.
 */
export function places(entries: readonly ChoiceEntry[]): Map<string, number> {
  const out = new Map<string, number>();
  entries.forEach((entry, index) => {
    if (entry.votes === 0) return;
    const before = entries[index - 1];
    out.set(
      entry.login,
      before && before.votes === entry.votes ? out.get(before.login)! : index + 1,
    );
  });
  return out;
}

/** A booth's trophy: its place when it's in the top three, otherwise undefined. */
export function trophyFor(login: string, choice: PeoplesChoice | undefined): 1 | 2 | 3 | undefined {
  if (!choice) return undefined;
  const place = places(choice.booths).get(login.toLowerCase());
  return place && place <= 3 ? (place as 1 | 2 | 3) : undefined;
}

/** The leaders: the booths with a trophy, and the home factories in first place. */
export function leaders(choice: PeoplesChoice | undefined) {
  if (!choice) return { booths: [], factories: [] };
  const top = (entries: ChoiceEntry[], last: number) => {
    const at = places(entries);
    return entries.filter((entry) => (at.get(entry.login) ?? Infinity) <= last);
  };
  return { booths: top(choice.booths, 3), factories: top(choice.factories, 1) };
}

/** Where "Vote for this booth" goes: the booth's comment, if it has one. */
export const voteUrl = (login: string, choice: PeoplesChoice | undefined) =>
  choice?.booths.find((entry) => entry.login === login.toLowerCase())?.url;

/** Whether voting has closed at `now`. */
export const votingClosed = (now: Date, closes = VOTING_CLOSES) =>
  now.getTime() > new Date(closes).getTime();
