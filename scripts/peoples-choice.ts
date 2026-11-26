/**
 * The People's Choice standings, from the comments on its ballot issue (plain
 * functions). Each booth and each home factory has one comment, which the
 * deploy's own token wrote with a marker, and a vote is a 👍 on it: one per
 * GitHub account, because a reaction is. An owner's own vote doesn't count,
 * nor does one given after voting closed, and the kill switch's booths drop out.
 */
import { SETTINGS } from '../src/settings.ts';
import type { BadgeHolder } from '../src/northpole/badges.ts';
import type {
  ChoiceCategory,
  ChoiceEntry,
  PeoplesChoice,
} from '../src/northpole/peoples-choice.ts';
import { safeInline } from './safe-text.ts';

/** A comment on the ballot, as the GraphQL API gives it. */
export interface RawChoiceComment {
  url: string;
  body: string;
  createdAt: string;
  /** Whether the token reading it wrote it: only the deploy's own comments are entries. */
  viewerDidAuthor: boolean;
  /** Its 👍 reactions: when, and by whose account. */
  votes: { createdAt: string; userId: number | null }[];
}

/**
 * The marker on an entry's comment, saying whose entry it is: the login, and
 * the owner's numeric user id when the comment was written, so their own vote
 * stays out even after the login changes hands.
 */
export const marker = (category: ChoiceCategory, login: string, ownerId: number) =>
  `<!-- peoples-choice:${category}:${login.toLowerCase()}:${ownerId} -->`;

const MARKER = /<!-- peoples-choice:(booth|factory):([a-z0-9-]{1,39}):([1-9]\d{0,15}) -->/;

/** Whose entry a comment is, from its marker, or undefined. */
export function readMarker(
  body: string,
): { category: ChoiceCategory; login: string; ownerId: number } | undefined {
  const found = MARKER.exec(body);
  return found
    ? { category: found[1] as ChoiceCategory, login: found[2], ownerId: Number(found[3]) }
    : undefined;
}

/**
 * A new entry's comment. The login and repository go through safeInline, so
 * the comment pings no one and links nothing but what we put in. `site` is
 * the map's address, ending in a slash, when the deploy knows it.
 */
export function entryBody(
  category: ChoiceCategory,
  login: string,
  ownerId: number,
  repo: string | undefined,
  site: string | undefined,
): string {
  const who = safeInline(`@${login}`, 60);
  const path = (repo ?? '').split('/').map(encodeURIComponent).join('/');
  const [title, link, vote] =
    category === 'booth'
      ? [
          `**Booth: ${who}**`,
          site && `Visit it: ${site}#/booth/${encodeURIComponent(login)}`,
          'Vote for this booth with a 👍 on this comment.',
        ]
      : [
          `**Home factory: ${who}**`,
          repo && `See it: ${SETTINGS.github.web}/${path}`,
          'Vote for this home factory with a 👍 on this comment.',
        ];
  return [title, ...(link ? [link] : []), '', vote, '', marker(category, login, ownerId)].join(
    '\n',
  );
}

/** The entries the ballot should have: every booth, and every Elf Engineer's factory. */
export interface ChoiceEntrants {
  booths: readonly string[];
  holders: readonly BadgeHolder[];
}

/** The entries with no comment yet, to add. */
export function missingEntries(
  entrants: ChoiceEntrants,
  comments: readonly RawChoiceComment[],
): { category: ChoiceCategory; login: string; repo?: string }[] {
  const have = new Set(
    comments
      .filter((comment) => comment.viewerDidAuthor)
      .map((comment) => readMarker(comment.body))
      .filter((found) => found !== undefined)
      .map((found) => `${found.category}:${found.login}`),
  );
  return [
    ...entrants.booths
      .map((login) => login.toLowerCase())
      .filter((login) => !have.has(`booth:${login}`))
      .map((login) => ({ category: 'booth' as const, login })),
    ...entrants.holders
      .filter((holder) => !have.has(`factory:${holder.login}`))
      .map((holder) => ({ category: 'factory' as const, login: holder.login, repo: holder.repo })),
  ];
}

export interface StandingsInput extends ChoiceEntrants {
  ballot: string;
  comments: readonly RawChoiceComment[];
  /** The kill switch's booths. */
  disabled: readonly string[];
  /** When voting closes. */
  closes: string;
}

/** The votes on a comment that count: one per account, not its owner's, and not after closing. */
export function countVotes(
  votes: RawChoiceComment['votes'],
  ownerId: number,
  closes: string,
): number {
  const end = new Date(closes).getTime();
  const voters = new Set<number>();
  for (const vote of votes) {
    if (vote.userId === null || vote.userId === ownerId) continue;
    if (!(new Date(vote.createdAt).getTime() <= end)) continue;
    voters.add(vote.userId);
  }
  return voters.size;
}

/**
 * The standings: every booth on the map and every Elf Engineer's factory with
 * a comment of the deploy's own, most votes first. A booth the kill switch
 * closed, or a comment anyone else wrote, is left out, and the first comment
 * for an entry is the one that counts. The owner whose vote is left out is the
 * user id in that comment's marker, never whoever has the login now.
 */
export function standings(input: StandingsInput): PeoplesChoice {
  const off = new Set(input.disabled.map((login) => login.toLowerCase()));
  const booths = new Set(input.booths.map((login) => login.toLowerCase()));
  const repos = new Map(input.holders.map((holder) => [holder.login, holder.repo]));
  const found = new Map<string, ChoiceEntry>();
  const sorted = [...input.comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const comment of sorted) {
    if (!comment.viewerDidAuthor) continue;
    const entry = readMarker(comment.body);
    if (!entry) continue;
    const key = `${entry.category}:${entry.login}`;
    if (found.has(key)) continue;
    if (entry.category === 'booth' && (!booths.has(entry.login) || off.has(entry.login))) continue;
    if (entry.category === 'factory' && !repos.has(entry.login)) continue;
    const votes = countVotes(comment.votes, entry.ownerId, input.closes);
    const repo = entry.category === 'factory' ? repos.get(entry.login) : undefined;
    found.set(key, { login: entry.login, url: comment.url, votes, ...(repo ? { repo } : {}) });
  }
  const category = (prefix: ChoiceCategory) =>
    [...found]
      .filter(([key]) => key.startsWith(`${prefix}:`))
      .map(([, entry]) => entry)
      .sort((a, b) => b.votes - a.votes || a.login.localeCompare(b.login));
  return {
    ballot: input.ballot,
    booths: category('booth'),
    factories: category('factory'),
  };
}
