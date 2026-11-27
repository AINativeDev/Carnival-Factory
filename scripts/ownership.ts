/**
 * The rule that keeps every participant inside their own booth: a pull request
 * may only change files under `carnival/booths/<owner>/`, where the owner is the
 * person the change is for. Maintainers may change anything.
 *
 * These are plain functions so they can be tested without GitHub.
 * `check-booth-ownership.ts` fetches the pull request and calls them.
 */
import { isNorthPoleLevel } from '../src/northpole/north-pole-levels.ts';

/**
 * The people who may change any file, and who merge every pull request. They
 * are matched by numeric GitHub user id, which never changes: a login can be
 * renamed and later taken by someone else. The login is only for reading.
 * The same ids are in tessl.json's event.sender.id filters.
 */
export const MAINTAINERS: readonly { login: string; id: number }[] = [
  { login: 'jedi4ever', id: 70908 },
];

/** The bots whose pull requests are for the person who wrote the linked issue. */
export const FACTORY_BOTS = ['tessl-app[bot]'];

/** Dependabot's own account, matched by its numeric id like a maintainer (ADR 0060). */
export const DEPENDABOT = { login: 'dependabot[bot]', id: 49699333 } as const;

/** The packages' files and the workflows: all a Dependabot pull request may change. */
const isDependencyFile = (file: string) =>
  file === 'package.json' ||
  file === 'package-lock.json' ||
  /^\.github\/workflows\/[\w.-]+\.ya?ml$/.test(file);

/**
 * Whether a pull request is Dependabot keeping a package or a workflow's
 * action up to date: its own account, by id, changing only those files. It
 * never merges on its own: the merge gate takes booths only, so a maintainer
 * reviews it.
 */
export function isDependencyUpdate(author: Author, files: readonly string[]): boolean {
  return (
    author.isBot && author.id === DEPENDABOT.id && files.length > 0 && files.every(isDependencyFile)
  );
}

export function boothFolder(login: string): string {
  return `carnival/booths/${login.toLowerCase()}/`;
}

/** A participant's level: their whole world of their own, theirs like their booth. */
export function levelFolder(login: string): string {
  return `carnival/levels/${login.toLowerCase()}/`;
}

export function isMaintainer(person: Pick<Author, 'id'>): boolean {
  // Stryker disable next-line MethodExpression: with one maintainer, `every` and `some` agree.
  return MAINTAINERS.some((maintainer) => maintainer.id === person.id);
}

export function isFactory(author: Author): boolean {
  return author.isBot && FACTORY_BOTS.includes(author.login.toLowerCase());
}

/**
 * The issue a pull request is for. The factory marks its pull requests with
 * `<!-- tessl-factory:issue: <owner/repo>#<n> -->`; otherwise a single
 * `Closes #<n>` line counts. Anything ambiguous gives undefined.
 */
export function linkedIssue(body: string, repository: string): number | undefined {
  const markers = [
    ...body.matchAll(/<!--\s*tessl-factory:issue:\s*([\w.-]+\/[\w.-]+)#(\d+)\s*-->/g),
  ];
  if (markers.length > 0) {
    const numbers = new Set(
      markers
        .filter(([, repo]) => repo.toLowerCase() === repository.toLowerCase())
        .map(([, , n]) => Number(n)),
    );
    // One marker only: a body that names two issues, even one twice, is for neither.
    // A marker for another repository leaves `numbers` empty, and so undefined.
    return markers.length === 1 ? [...numbers][0] : undefined;
  }

  const closes = new Set(
    [...body.matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi)].map(([, n]) =>
      Number(n),
    ),
  );
  return closes.size === 1 ? [...closes][0] : undefined;
}

export interface Author {
  login: string;
  /** The numeric GitHub user id: what identity is checked by, since logins can change hands. */
  id: number;
  isBot: boolean;
}

/**
 * Whose booth a pull request may change, as the person, id and all. A person's own pull request is for
 * them. The factory's pull request is for whoever wrote the issue it links to.
 * Any other bot's pull request is for nobody, and so is the factory's when no
 * person wrote the issue.
 */
export function boothOwner(author: Author, issueAuthor: Author | undefined): Author | undefined {
  const person = (who: Author) => ({ ...who, login: who.login.toLowerCase() });
  if (!author.isBot) return person(author);
  if (isFactory(author) && issueAuthor && !issueAuthor.isBot) return person(issueAuthor);
  return undefined;
}

/** The files a pull request touches outside its owner's booth and level. Empty means it may merge. */
export function filesOutsideBooth(owner: Author, files: readonly string[]): string[] {
  if (isMaintainer(owner)) return [];
  // A North Pole level is the maintainers', even for someone whose login is its name (ADR 0035).
  // Stryker disable next-line ArrayDeclaration: a folder no file is in allows nothing, like no folder.
  const level = isNorthPoleLevel(owner.login.toLowerCase()) ? [] : [levelFolder(owner.login)];
  const folders = [boothFolder(owner.login), ...level];
  return files.filter((file) => !folders.some((folder) => file.startsWith(folder)));
}

/**
 * Escapes text for a GitHub Actions log command (`::error file=…::message`).
 * A file name can hold a newline, which would otherwise start a command of its own.
 */
export function escapeCommand(text: string): string {
  return text
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/:/g, '%3A')
    .replace(/,/g, '%2C');
}

/** An issue event from the GitHub API, as much of it as approval needs. */
export interface IssueEvent {
  event: string;
  label?: { name: string };
  actor?: { id: number } | null;
}

/**
 * Whether a maintainer approved an issue for the factory: the latest time the
 * `tessl` label was added, it was a maintainer who added it, by numeric id.
 * Such an issue may change anything, like a maintainer's own issue, even when
 * a participant wrote it. Anyone else adding the label approves nothing.
 */
export function approvedByMaintainer(events: readonly IssueEvent[]): boolean {
  const added = events.filter((e) => e.event === 'labeled' && e.label?.name === 'tessl');
  const last = added.at(-1);
  return !!last?.actor && isMaintainer(last.actor);
}
