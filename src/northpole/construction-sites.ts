/**
 * The booths being built, as `pending.json` lists them: each accepted booth
 * request not merged yet, its stage, and the spot held for it. The deploy
 * writes the file and the page reads it every few minutes, so it's checked
 * here as untrusted data before the map draws a construction site from it.
 * It's apart from `spots.ts`, which decides where every booth stands, because
 * this is about reading a file the page didn't build itself.
 */

/** How far along a booth request is. */
export type Stage = 'building' | 'checks' | 'almost' | 'maintainer';

/** What each stage says on the sign and the tag. */
export const STAGE_TEXT: Record<Stage, string> = {
  building: 'Being built',
  checks: 'Checks running',
  almost: 'Almost there',
  maintainer: 'Waiting for a maintainer',
};

/** One accepted booth request not merged yet, as `pending.json` lists it. */
export interface PendingBooth {
  /** The request's author, as GitHub's API names them, in lower case. */
  login: string;
  /** The request's issue number. */
  issue: number;
  /** The spot held for it. A booth that already exists keeps its own. */
  spot: number;
  stage: Stage;
}

/** The most entries the page reads from `pending.json`. */
export const MAX_PENDING = 100;

/**
 * Whether `text` is a GitHub login: letters, digits and single hyphens, at most
 * 39 characters. Written inside the function, so mutation testing (ADR 0061)
 * checks the pattern with the tests that call it, rather than only as the
 * module loads.
 */
function isLogin(text: string): boolean {
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(text);
}

/** A spot number: a whole number from 0 up to the island's furthest. */
export const isSpot = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) < 10000;

/** An issue's number: a whole number from 1. */
export const isIssue = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) > 0;

/**
 * `pending.json`'s entries the page can trust: valid logins, issue and spot
 * numbers and stages, one per login, at most `MAX_PENDING`. Anything else,
 * including any other field, is dropped.
 */
export function readPending(value: unknown): PendingBooth[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const pending: PendingBooth[] = [];
  for (const entry of value.slice(0, MAX_PENDING)) {
    if (!entry || typeof entry !== 'object') continue;
    const { login, issue, spot, stage } = entry as Record<string, unknown>;
    if (typeof login !== 'string' || !isLogin(login)) continue;
    if (!isIssue(issue)) continue;
    if (!isSpot(spot)) continue;
    if (typeof stage !== 'string' || !Object.hasOwn(STAGE_TEXT, stage)) continue;
    const id = login.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    pending.push({ login: id, issue, spot, stage: stage as Stage });
  }
  return pending;
}
