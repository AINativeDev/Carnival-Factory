/**
 * The Elf Engineer badge's rules, as plain functions: reading a badge request
 * and deciding it from what GitHub says about the participant's repository.
 * scripts/check-elf-engineer.ts does the GitHub calls; nothing here does. The
 * record a grant leaves is in scripts/badge-grants.ts, and the badge's page in
 * scripts/badge-page.ts.
 */
import { isRepo, type BadgeTier } from '../src/northpole/badges.ts';
import { formField } from './issue-form.ts';
import { FACTORY_BOTS } from './ownership.ts';

/** The issue form's labels for its two fields, as the issue's body shows them. */
export const FORM_FIELDS = {
  repo: 'Your repository',
  pull: 'A pull request the factory opened there',
};

/** A repository as `owner/name`, from `owner/name` or its github.com address. */
export function parseRepository(text: string | undefined): string | undefined {
  const [, repo] =
    text
      ?.trim()
      .match(/^(?:https?:\/\/(?:www\.)?github\.com\/)?([^/\s]+\/[^/\s]+?)(?:\.git)?\/?$/i) ?? [];
  return repo && isRepo(repo) ? repo : undefined;
}

/** A pull request's repository and number, from its github.com address. */
export function parsePullRequest(
  text: string | undefined,
): { repo: string; number: number } | undefined {
  const [, repo, number] =
    text
      ?.trim()
      .match(
        /^https?:\/\/(?:www\.)?github\.com\/([^/\s]+\/[^/\s]+)\/pull\/(\d{1,9})(?:[/?#]\S*)?$/i,
      ) ?? [];
  if (!repo || !number || !isRepo(repo)) return undefined;
  return { repo, number: Number(number) };
}

/**
 * The issue's title and body with the two form fields' values taken out
 * wherever they parse, for the injection scan. A value that parses is only a
 * repository name or a pull request link, so a name such as `octocat/role-play`
 * never reads as text aimed at an agent; anything else is scanned.
 */
export function freeText(title: string, body: string): string {
  let text = `${title}\n${body.replace(/\r\n?/g, '\n')}`;
  const pull = formField(body, FORM_FIELDS.pull);
  const repo = formField(body, FORM_FIELDS.repo);
  // The link first, since it holds the repository's name.
  if (pull && parsePullRequest(pull)) text = text.replaceAll(pull, '');
  if (repo && parseRepository(repo)) text = text.replaceAll(repo, '');
  return text;
}

/** The tier for this many factory pull requests merged: bronze from 1, silver from 5, gold from 25. */
export function tierFor(merged: number): BadgeTier | undefined {
  if (merged >= 25) return 'gold';
  if (merged >= 5) return 'silver';
  if (merged >= 1) return 'bronze';
  return undefined;
}

/** What GitHub says about a badge request. Anything it couldn't find is undefined. */
export interface BadgeFacts {
  /** The issue's author. */
  author: string;
  /** The repository the form names, as written. */
  repoField?: string | undefined;
  /** The pull request the form names, as written. */
  pullField?: string | undefined;
  /** Whether `scanParticipantText` in scripts/injection-scan.ts found anything in the request's `freeText`. */
  flaggedText?: boolean | undefined;
  repo?: { fullName: string; private: boolean; owner: string } | undefined;
  /** Whether the author is a public member of the organisation that owns the repository. */
  authorIsMember?: boolean | undefined;
  /** Whether the repository has a `tessl.json` at its root. */
  hasTesslJson?: boolean | undefined;
  /**
   * The linked pull request, its repository as GitHub resolves the link's, so a
   * link from before the repository was renamed still names it.
   */
  pull?: { repo: string; number: number; author: string; authorIsBot: boolean } | undefined;
  /** How many pull requests the factory opened there have merged. */
  merged?: number | undefined;
}

/** A grant, a decline, or, with `review`, a request a maintainer decides. */
export type BadgeDecision =
  { grant: true; repo: string; tier?: BadgeTier } | { grant: false; reason: string; review?: true };

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * Grants the badge only when the request names a public repository of the
 * author's own, with a `tessl.json`, and a pull request in it the Tessl App
 * opened. A request with text the injection scan flags goes to a maintainer,
 * since a hit isn't proof. Otherwise declines, with the first reason that
 * applies. A private repository is declined just like one GitHub can't find,
 * by the name the requester wrote, so the public reason never shows what a
 * token that reads private repositories found.
 */
export function decideBadge(facts: BadgeFacts): BadgeDecision {
  if (facts.flaggedText) {
    return { grant: false, review: true, reason: 'a maintainer will look at this request' };
  }
  const named = parseRepository(facts.repoField);
  if (!named) return { grant: false, reason: 'the form needs your repository, as owner/name' };
  const pullAt = parsePullRequest(facts.pullField);
  if (!pullAt) {
    return { grant: false, reason: 'the form needs a link to a pull request in that repository' };
  }
  const repo = facts.repo;
  if (!repo || repo.private) {
    return { grant: false, reason: `${named} isn't a public repository the factory can see` };
  }
  if (!same(repo.owner, facts.author) && !facts.authorIsMember) {
    return { grant: false, reason: `${repo.fullName} isn't yours or your organisation's` };
  }
  if (!facts.hasTesslJson) {
    return { grant: false, reason: `${repo.fullName} has no tessl.json at its root` };
  }
  const pull = facts.pull;
  if (!pull || !same(pull.repo, repo.fullName) || pull.number !== pullAt.number) {
    return { grant: false, reason: `that pull request isn't in ${repo.fullName}` };
  }
  if (!pull.authorIsBot || !FACTORY_BOTS.includes(pull.author.toLowerCase())) {
    return { grant: false, reason: "that pull request wasn't opened by the Tessl App" };
  }
  const tier = tierFor(facts.merged ?? 0);
  return tier ? { grant: true, repo: repo.fullName, tier } : { grant: true, repo: repo.fullName };
}
