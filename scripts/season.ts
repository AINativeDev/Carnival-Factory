/**
 * Each participant's season at the North Pole, counted from the repository's
 * booth requests when the site is built (scripts/season-data.ts). Plain
 * functions, so the counting is tested without the GitHub API.
 */

/** The review bot whose findings the factory fixes. */
export const REVIEWER = 'tessl-reviewer';

/** One participant's season. A number left out has no source yet, and the card skips it. */
export interface SeasonStats {
  /** Booth requests they filed. */
  requests: number;
  /** Requests a merged pull request closed. */
  shipped: number;
  /** Review findings on those pull requests that the factory resolved. */
  findingsFixed: number;
  /** Times their booth was featured on the opening map (#33). */
  featured?: number;
  /** Votes their booth received (#34). */
  votes?: number;
  /** Advent challenges done. */
  advent?: number;
}

/** What the build hands the page: every participant's season, by lower-case login. */
export interface SeasonData {
  /** When the numbers were counted, or null when the build had none to count. */
  countedAt: string | null;
  participants: Record<string, SeasonStats>;
}

export const EMPTY_SEASON: SeasonData = { countedAt: null, participants: {} };

/** A booth request as the GitHub API describes it, cut down to what the count needs. */
export interface RequestRecord {
  author: string | null;
  pulls: {
    number: number;
    merged: boolean;
    threads: { resolved: boolean; author: string | null }[];
  }[];
}

/**
 * Counts every participant's season from their booth requests. A pull request
 * that closed two of one participant's requests counts once for their findings,
 * and one that closed requests of two participants counts for each of them.
 */
export function countSeason(requests: readonly RequestRecord[], countedAt: string): SeasonData {
  const participants: Record<string, SeasonStats> = {};
  const countedFor = new Map<string, Set<number>>();
  for (const request of requests) {
    if (!request.author) continue;
    const login = request.author.toLowerCase();
    // Own properties only: a login such as `constructor` is also a name every object inherits.
    const stats = Object.hasOwn(participants, login)
      ? participants[login]
      : (participants[login] = { requests: 0, shipped: 0, findingsFixed: 0 });
    let counted = countedFor.get(login);
    if (!counted) countedFor.set(login, (counted = new Set()));
    stats.requests++;
    const merged = request.pulls.filter((pull) => pull.merged);
    if (merged.length > 0) stats.shipped++;
    for (const pull of merged) {
      if (counted.has(pull.number)) continue;
      counted.add(pull.number);
      stats.findingsFixed += pull.threads.filter(
        (thread) => thread.resolved && thread.author?.replace(/\[bot\]$/, '') === REVIEWER,
      ).length;
    }
  }
  return { countedAt, participants };
}

/** One participant's counts, if the season has any for them. */
export function seasonStats(season: SeasonData, login: string): SeasonStats | undefined {
  return Object.hasOwn(season.participants, login) ? season.participants[login] : undefined;
}

/** Reads a season file, keeping only well-formed counts, so a bad file is an empty season. */
export function readSeason(value: unknown): SeasonData {
  if (typeof value !== 'object' || value === null) return EMPTY_SEASON;
  const { countedAt, participants } = value as Record<string, unknown>;
  if (typeof participants !== 'object' || participants === null) return EMPTY_SEASON;
  const count = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0);
  const optional = (n: unknown) => (n === undefined ? undefined : count(n));
  const out: Record<string, SeasonStats> = {};
  for (const [login, stats] of Object.entries(participants)) {
    if (!/^[a-z0-9-]+$/.test(login) || typeof stats !== 'object' || stats === null) continue;
    const s = stats as Record<string, unknown>;
    out[login] = {
      requests: count(s.requests),
      shipped: count(s.shipped),
      findingsFixed: count(s.findingsFixed),
      ...(s.featured !== undefined && { featured: optional(s.featured) }),
      ...(s.votes !== undefined && { votes: optional(s.votes) }),
      ...(s.advent !== undefined && { advent: optional(s.advent) }),
    };
  }
  return { countedAt: typeof countedAt === 'string' ? countedAt : null, participants: out };
}
