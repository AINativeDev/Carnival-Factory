/**
 * The rule that keeps every participant inside their own plot: a pull request
 * may only change files under `src/plots/<owner>/`, where the owner is the
 * person the change is for. Maintainers may change anything.
 *
 * These are plain functions so they can be tested without GitHub.
 * `check-plot-ownership.ts` fetches the pull request and calls them.
 */

/** GitHub logins that may change any file, and who merge every pull request. */
export const MAINTAINERS = ['jedi4ever'];

export function plotFolder(login: string): string {
  return `src/plots/${login.toLowerCase()}/`;
}

export function isMaintainer(login: string): boolean {
  return MAINTAINERS.includes(login.toLowerCase());
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
    return markers.length === 1 && numbers.size === 1 ? [...numbers][0] : undefined;
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
  isBot: boolean;
}

/**
 * Whose plot a pull request may change. A person's own pull request is for
 * them. A bot's pull request, such as the factory's, is for whoever wrote the
 * issue it links to. Undefined when there is no person to tie it to.
 */
export function plotOwner(author: Author, issueAuthor: Author | undefined): string | undefined {
  if (!author.isBot) return author.login.toLowerCase();
  if (issueAuthor && !issueAuthor.isBot) return issueAuthor.login.toLowerCase();
  return undefined;
}

/** The files a pull request touches outside its owner's plot. Empty means it may merge. */
export function filesOutsidePlot(owner: string, files: readonly string[]): string[] {
  if (isMaintainer(owner)) return [];
  const folder = plotFolder(owner);
  return files.filter((file) => !file.startsWith(folder));
}
