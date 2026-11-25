/**
 * The Elf Engineer badge: for participants who set up a Tessl factory on a
 * repository of their own. The build reads who holds it from the accepted
 * `badge-request` issues (scripts/badge-holders.ts) and bakes the list into
 * the page, so the page never asks the network for it.
 */

/** A badge's tier: bronze, silver and gold for 1, 5 and 25 factory pull requests merged. */
export type BadgeTier = 'bronze' | 'silver' | 'gold';

export const BADGE_TIERS: readonly BadgeTier[] = ['bronze', 'silver', 'gold'];

/** Someone who holds the badge: their login, their factory's repository, and their tier, if any. */
export interface BadgeHolder {
  login: string;
  repo: string;
  tier?: BadgeTier;
}

/** A GitHub login, in lower case, as a booth's folder is named. */
const LOGIN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/;
/** A repository as `owner/name`. */
const REPO = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}\/[A-Za-z0-9._-]{1,100}$/;

const isLogin = (text: string) => LOGIN.test(text);
export const isRepo = (text: string) => REPO.test(text) && !/\/\.\.?$/.test(text);

/**
 * The holders from untrusted JSON: only well-formed entries, logins in lower
 * case, and the last entry for a login wins.
 */
export function cleanHolders(data: unknown): BadgeHolder[] {
  if (!Array.isArray(data)) return [];
  const byLogin = new Map<string, BadgeHolder>();
  for (const entry of data as unknown[]) {
    if (!entry || typeof entry !== 'object') continue;
    const { login, repo, tier } = entry as Record<string, unknown>;
    if (typeof login !== 'string' || typeof repo !== 'string') continue;
    const lower = login.toLowerCase();
    if (!isLogin(lower) || !isRepo(repo)) continue;
    const holder: BadgeHolder = { login: lower, repo };
    if (BADGE_TIERS.includes(tier as BadgeTier)) holder.tier = tier as BadgeTier;
    byLogin.delete(lower);
    byLogin.set(lower, holder);
  }
  return [...byLogin.values()];
}

declare const __BADGE_HOLDERS__: unknown;

/** Everyone holding the badge, as the build found them. */
export const BADGE_HOLDERS: readonly BadgeHolder[] = cleanHolders(
  typeof __BADGE_HOLDERS__ === 'undefined' ? [] : __BADGE_HOLDERS__,
);

/** The badge a booth's owner holds, if they hold one. */
export const badgeFor = (login: string, holders: readonly BadgeHolder[] = BADGE_HOLDERS) =>
  holders.find((holder) => holder.login === login.toLowerCase());

/** Where "See @login's own factory" goes: the holder's repository. */
export const factoryUrl = (holder: BadgeHolder) =>
  `https://github.com/${holder.repo.split('/').map(encodeURIComponent).join('/')}`;

/** The badge image's path on the site, from its root. */
export const badgeImage = (tier?: BadgeTier) => `badges/elf-engineer${tier ? `-${tier}` : ''}.svg`;

/**
 * The Markdown to paste into a README: the badge from the site, linking back to
 * the map. `site` is the site's address, ending in a slash.
 */
export const badgeSnippet = (site: string, tier?: BadgeTier) =>
  `[![Elf Engineer${tier ? `: ${tier}` : ''}](${site}${badgeImage(tier)})](${site})`;
