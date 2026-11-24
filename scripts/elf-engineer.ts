/**
 * The Elf Engineer badge's rules, as plain functions: reading a badge request,
 * deciding it from what GitHub says about the participant's repository, the
 * record the decision leaves on the issue, and the badge holders the build
 * reads from those records. scripts/check-elf-engineer.ts and
 * scripts/badge-holders.ts do the GitHub calls; nothing here does.
 */
import {
  BADGE_TIERS,
  badgeImage,
  badgeSnippet,
  cleanHolders,
  isRepo,
  type BadgeHolder,
  type BadgeTier,
} from '../northpole/badges.ts';
import { FACTORY_BOTS } from './ownership.ts';
import { escapeHtml } from './share-pages.ts';

/** The issue form's labels for its two fields, as the issue's body shows them. */
export const FORM_FIELDS = {
  repo: 'Your repository',
  pull: 'A pull request the factory opened there',
};

/** The value under a `### <label>` heading of an issue form's body, or undefined when it's empty. */
export function formField(body: string, label: string): string | undefined {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((line) => line.trim() === `### ${label}`);
  if (start < 0) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('### '));
  const value = (end < 0 ? rest : rest.slice(0, end)).join('\n').trim();
  return value && value !== '_No response_' ? value : undefined;
}

/** A repository as `owner/name`, from `owner/name` or its github.com address. */
export function parseRepository(text: string | undefined): string | undefined {
  const match = text
    ?.trim()
    .match(/^(?:https?:\/\/(?:www\.)?github\.com\/)?([^/\s]+\/[^/\s]+?)(?:\.git)?\/?$/i);
  return match && isRepo(match[1]) ? match[1] : undefined;
}

/** A pull request's repository and number, from its github.com address. */
export function parsePullRequest(
  text: string | undefined,
): { repo: string; number: number } | undefined {
  const match = text
    ?.trim()
    .match(/^https?:\/\/(?:www\.)?github\.com\/([^/\s]+\/[^/\s]+)\/pull\/(\d{1,9})(?:[/?#]\S*)?$/i);
  if (!match || !isRepo(match[1])) return undefined;
  return { repo: match[1], number: Number(match[2]) };
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
  repoField?: string;
  /** The pull request the form names, as written. */
  pullField?: string;
  /** Whether `scanParticipantText` in scripts/injection-scan.ts found anything in the issue's title or body. */
  flaggedText?: boolean;
  repo?: { fullName: string; private: boolean; owner: string };
  /** Whether the author is a public member of the organisation that owns the repository. */
  authorIsMember?: boolean;
  /** Whether the repository has a `tessl.json` at its root. */
  hasTesslJson?: boolean;
  /**
   * The linked pull request, its repository as GitHub resolves the link's, so a
   * link from before the repository was renamed still names it.
   */
  pull?: { repo: string; number: number; author: string; authorIsBot: boolean };
  /** How many pull requests the factory opened there have merged. */
  merged?: number;
}

export type BadgeDecision =
  { grant: true; repo: string; tier?: BadgeTier } | { grant: false; reason: string };

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * Grants the badge only when the request names a public repository of the
 * author's own, with a `tessl.json`, and a pull request in it the Tessl App
 * opened, and the request holds nothing aimed at an agent or hidden. Otherwise
 * declines, with the first reason that applies.
 */
export function decideBadge(facts: BadgeFacts): BadgeDecision {
  if (facts.flaggedText) {
    return {
      grant: false,
      reason: 'the request has text beyond its two fields that the factory cannot take',
    };
  }
  const named = parseRepository(facts.repoField);
  if (!named) return { grant: false, reason: 'the form needs your repository, as owner/name' };
  const pullAt = parsePullRequest(facts.pullField);
  if (!pullAt) {
    return { grant: false, reason: 'the form needs a link to a pull request in that repository' };
  }
  const repo = facts.repo;
  if (!repo) return { grant: false, reason: `${named} isn't a repository the factory can see` };
  if (repo.private) return { grant: false, reason: `${repo.fullName} isn't public` };
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

/** The line a granting comment carries, which the build reads back. */
export const grantMarker = (repo: string, tier?: BadgeTier) =>
  `<!-- elf-engineer-badge: ${repo} ${tier ?? 'none'} -->`;

/** The grant a comment records, if it carries a well-formed marker. */
export function readGrant(body: string): { repo: string; tier?: BadgeTier } | undefined {
  const match = body.match(/<!-- elf-engineer-badge: ([^\s]+) (none|bronze|silver|gold) -->/);
  if (!match || !isRepo(match[1])) return undefined;
  const tier = match[2] === 'none' ? undefined : (match[2] as BadgeTier);
  return tier ? { repo: match[1], tier } : { repo: match[1] };
}

/** A badge request as the GitHub API gives it, with its comments. */
export interface BadgeRequestRecord {
  issue: { number: number; user: { login: string }; labels?: { name: string }[] };
  comments: { user: { login: string; type: string }; body: string; created_at: string }[];
}

/** The start of every comment the assess-badge-request skill writes. */
export const ASSESSMENT_MARKER = '<!-- assess-badge-request -->';

/**
 * The badge holders, from the accepted badge requests: only grants the Tessl
 * App wrote count, each for the issue's author, and a newer grant replaces an
 * older one, so asking again moves someone up a tier. A request counts only by
 * its latest decision, so a grant a later decline replaced, or one on a request
 * labelled `declined`, is never published.
 */
export function badgeHolders(records: readonly BadgeRequestRecord[]): BadgeHolder[] {
  const grants: { at: string; holder: BadgeHolder }[] = [];
  for (const { issue, comments } of records) {
    if (issue.labels?.some((label) => label.name === 'declined')) continue;
    const decisions = comments
      .filter(
        (comment) =>
          comment.user.type === 'Bot' &&
          FACTORY_BOTS.includes(comment.user.login.toLowerCase()) &&
          (comment.body.trimStart().startsWith(ASSESSMENT_MARKER) || readGrant(comment.body)),
      )
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    const latest = decisions.at(-1);
    const grant = latest && readGrant(latest.body);
    if (latest && grant)
      grants.push({ at: latest.created_at, holder: { login: issue.user.login, ...grant } });
  }
  grants.sort((a, b) => a.at.localeCompare(b.at));
  return cleanHolders(grants.map((grant) => grant.holder));
}

/**
 * The page the build writes at `badges/index.html`: each badge, and the
 * Markdown to paste for it. No scripts, and the images are plain static
 * files, so nothing is tracked. `site` is the site's address, ending in a
 * slash, or empty for links relative to the page.
 */
export function badgePage(site: string, requestUrl: string): string {
  const rows = [undefined, ...BADGE_TIERS]
    .map((tier) => {
      const snippet = badgeSnippet(site || '../', tier);
      const label = tier ? `${tier[0].toUpperCase()}${tier.slice(1)}` : 'Elf Engineer';
      return `    <section>
      <h2>${label}</h2>
      <p><img src="../${badgeImage(tier)}" alt="Elf Engineer${tier ? `: ${tier}` : ''}" width="200" height="28"></p>
      <pre><code>${escapeHtml(snippet)}</code></pre>
    </section>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>The Elf Engineer badge | North Pole Carnival</title>
    <style>
      body { font: 16px/1.5 system-ui, sans-serif; max-width: 44rem; margin: 2rem auto; padding: 0 1rem; }
      pre { white-space: pre-wrap; word-break: break-all; padding: 0.75rem; background: #eef5fb; border-radius: 6px; }
    </style>
  </head>
  <body>
    <h1>The Elf Engineer badge</h1>
    <p>For people who set up a <a href="https://tessl.io">Tessl</a> factory on a repository of their own.
    <a href="${escapeHtml(requestUrl)}">Ask for it</a> with the Elf Engineer form, and once it's granted,
    paste the snippet into your README. Bronze, silver and gold are for 1, 5 and 25 factory pull requests
    merged on your repository: ask again with the same form to move up.</p>
    <p>The badges are plain image files, with no counters and nothing tracked.</p>
${rows}
    <p><a href="${escapeHtml(site || '../')}">Visit the North Pole Carnival</a></p>
  </body>
</html>
`;
}
