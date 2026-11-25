/**
 * The record an Elf Engineer grant leaves on its issue, and the badge holders
 * the build reads back from those records (scripts/badge-holders.ts). It is
 * apart from deciding a request (scripts/elf-engineer.ts) because the build
 * reads it long after, and trusts only what the Tessl App wrote.
 */
import { cleanHolders, isRepo, type BadgeHolder, type BadgeTier } from '../src/northpole/badges.ts';
import { FACTORY_BOTS } from './ownership.ts';

/** The line a granting comment carries, which the build reads back. */
export const grantMarker = (repo: string, tier?: BadgeTier) =>
  `<!-- elf-engineer-badge: ${repo} ${tier ?? 'none'} -->`;

/** The grant a comment records, if it carries a well-formed marker. */
export function readGrant(body: string): { repo: string; tier?: BadgeTier } | undefined {
  const [, repo, tier] =
    body.match(/<!-- elf-engineer-badge: ([^\s]+) (none|bronze|silver|gold) -->/) ?? [];
  if (!repo || !isRepo(repo)) return undefined;
  return tier && tier !== 'none' ? { repo, tier: tier as BadgeTier } : { repo };
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
