/**
 * The booths being built. The deploy writes `pending.json` beside the page
 * from the open, accepted booth requests (scripts/write-pending.ts), and
 * rewrites it whenever a request moves along. The page asks for it with a
 * query that changes every time, so no cache answers, and again every couple
 * of minutes while it's open, so a newly accepted request shows on the map
 * soon after.
 *
 * This is the page's own file on its own site: squares still never reach the
 * network. Without it, as in a preview or a local build, nothing is pending.
 */
import { readPending, type PendingBooth } from '../northpole/plots';

/** How often an open page reads `pending.json` again. */
export const PENDING_EVERY_MS = 2 * 60 * 1000;
/** Where the page remembers the construction sites it last showed, so the booth that replaces one sparkles. */
const STORAGE_KEY = 'north-pole-sites';

/** Reads the pending booth requests, bypassing every cache; undefined if it can't. */
export async function latestPending(base = document.baseURI): Promise<PendingBooth[] | undefined> {
  try {
    const url = new URL(`pending.json?t=${Date.now()}`, base);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return undefined;
    return readPending(await response.json());
  } catch {
    return undefined;
  }
}

/** The logins this browser last saw on construction sites, or none when storage is off. */
export function loadSites(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown;
    return Array.isArray(value) ? value.filter((login) => typeof login === 'string') : [];
  } catch {
    return [];
  }
}

export function saveSites(logins: readonly string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logins.slice(0, 100)));
  } catch {
    // No storage: a landed booth just doesn't sparkle.
  }
}

/** The last list read, so a map drawn again starts with it. */
let last: PendingBooth[] | undefined;
export const knownPending = () => last;

/** Reads the list now and every couple of minutes, calling `show` with each one read. Returns a stop. */
export function followPending(show: (pending: PendingBooth[]) => void): () => void {
  let stopped = false;
  const check = async () => {
    const pending = await latestPending();
    if (stopped || !pending) return;
    last = pending;
    show(pending);
  };
  void check();
  const timer = setInterval(() => void check(), PENDING_EVERY_MS);
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
