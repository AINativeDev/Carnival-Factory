/**
 * The Booths panel's logic: searching, sorting and choosing what each section
 * shows. Plain functions, so the panel and the tests use them the same way.
 */

/** One square as the panel lists it. */
export interface PanelEntry {
  kind: 'booth' | 'attraction';
  id: string;
  name: string;
}

/** How many squares Near you and Recently added show, and how many All booths shows at a time. */
export const NEAR_COUNT = 5;
export const RECENT_COUNT = 5;
export const PAGE_SIZE = 20;

/** Text folded for searching: lower case, without accents, and with a leading @ dropped. */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Mark}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/^@+/, '');
}

/** Whether a square matches a search, by its name or its owner's login, ignoring case and accents. */
export function matches(entry: PanelEntry, query: string): boolean {
  // An empty search is in every name, so it matches every square.
  const wanted = fold(query);
  return fold(entry.name).includes(wanted) || fold(entry.id).includes(wanted);
}

/**
 * The squares a search finds, best first: a login or name that starts with the
 * search before one that only contains it, then A to Z.
 */
export function search<T extends PanelEntry>(entries: readonly T[], query: string): T[] {
  const wanted = fold(query);
  if (!wanted) return [];
  const rank = (entry: T) =>
    fold(entry.id).startsWith(wanted) || fold(entry.name).startsWith(wanted) ? 0 : 1;
  return byName(entries.filter((entry) => matches(entry, query))).sort((a, b) => rank(a) - rank(b));
}

/** Squares A to Z by name, ignoring case and accents, then by id. */
export function byName<T extends PanelEntry>(entries: readonly T[]): T[] {
  return [...entries].sort(
    (a, b) =>
      fold(a.name).localeCompare(fold(b.name)) ||
      a.id.localeCompare(b.id) ||
      a.kind.localeCompare(b.kind),
  );
}

/** The first `shown` of a list, and whether there are more to show. */
export function page<T>(entries: readonly T[], shown: number): { items: T[]; more: boolean } {
  return { items: entries.slice(0, shown), more: entries.length > shown };
}

/**
 * The `count` newest booths, by when their folder first appeared (an ISO
 * date, from the build's git history), newest first. Booths with no date
 * known are left out.
 */
export function recentlyAdded<T extends PanelEntry>(
  booths: readonly T[],
  added: Readonly<Record<string, string>>,
  count = RECENT_COUNT,
): T[] {
  // Stryker disable next-line StringLiteral: no date and any text that isn't one both parse as no time
  const when = (booth: T) => Date.parse(added[booth.id.toLowerCase()] ?? '');
  return booths
    .filter((booth) => !Number.isNaN(when(booth)))
    .sort((a, b) => when(b) - when(a) || a.id.localeCompare(b.id))
    .slice(0, count);
}

/** A section's heading with its count, such as "All booths (42)". */
export const heading = (title: string, count: number) => `${title} (${count})`;

/** The next result for the arrow keys: down from the search box goes to the first, and it wraps. */
export function step(current: number, length: number, by: 1 | -1): number {
  if (length === 0) return -1;
  if (current < 0) return by === 1 ? 0 : length - 1;
  return (current + by + length) % length;
}

/** Reads the panel's remembered state, as saved by `saveState`, ignoring anything malformed. */
export function readState(saved: string | null): { me?: string; closed: string[] } {
  try {
    const value = JSON.parse(saved ?? '{}') as { me?: unknown; closed?: unknown };
    const me =
      typeof value.me === 'string' && /^[\w-]{1,39}$/.test(value.me)
        ? value.me.toLowerCase()
        : undefined;
    const closed = Array.isArray(value.closed)
      ? value.closed.filter((name): name is string => typeof name === 'string').slice(0, 10)
      : [];
    return { me, closed };
  } catch {
    return { closed: [] };
  }
}
