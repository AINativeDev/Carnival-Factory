/**
 * The advent calendar: 24 small challenges people do with a Tessl factory on
 * their own repository, one a day from 1 to 24 December. Its doors open by
 * date, and every challenge a participant marks done, once it's accepted,
 * decorates their booth. The build reads how many each participant has from
 * the accepted `advent-done` issues (scripts/write-advent.ts) and bakes the
 * counts into the page, so the page never asks the network for them.
 */

/** How many doors the calendar has. */
export const ADVENT_DAYS = 24;

/** One day's challenge, as challenges/advent.json lists it. */
export interface AdventChallenge {
  day: number;
  title: string;
  /** What to do. */
  do: string;
  /** How you'll know it worked. */
  check: string;
  /** The Tessl docs that help. */
  docs: string;
}

/** The calendar: its year, and its challenges in day order. */
export interface AdventCalendar {
  year: number;
  challenges: AdventChallenge[];
}

const isDay = (day: unknown): day is number =>
  Number.isInteger(day) && (day as number) >= 1 && (day as number) <= ADVENT_DAYS;

/** The calendar from its JSON: only well-formed challenges, one a day, in day order. */
export function cleanCalendar(data: unknown): AdventCalendar {
  const { year, challenges } = (data ?? {}) as Record<string, unknown>;
  const byDay = new Map<number, AdventChallenge>();
  for (const entry of Array.isArray(challenges) ? (challenges as unknown[]) : []) {
    if (!entry || typeof entry !== 'object') continue;
    const { day, title, do: what, check, docs } = entry as Record<string, unknown>;
    if (!isDay(day) || byDay.has(day)) continue;
    if (![title, what, check, docs].every((text) => typeof text === 'string' && text.trim()))
      continue;
    if (!/^https:\/\//.test(docs as string)) continue;
    byDay.set(day, {
      day,
      title: title as string,
      do: what as string,
      check: check as string,
      docs: docs as string,
    });
  }
  return {
    year: Number.isInteger(year) ? (year as number) : 0,
    challenges: [...byDay.values()].sort((a, b) => a.day - b.day),
  };
}

/** Whether a day's door is open at `now`, by the visitor's own calendar: from midnight on that day in December. */
export function isDoorOpen(day: number, now: Date, year: number): boolean {
  return now.getTime() >= new Date(year, 11, day).getTime();
}

/** The earliest time zone is fourteen hours ahead of UTC. */
const EARLIEST_ZONE = 14 * 60 * 60 * 1000;

/**
 * Whether a day's door is open somewhere in the world at `now`: from midnight
 * on that day in the earliest time zone. The assessment checks this, so
 * nobody is turned down for living ahead of UTC.
 */
export function isDoorOpenAnywhere(day: number, now: Date, year: number): boolean {
  return now.getTime() >= Date.UTC(year, 11, day) - EARLIEST_ZONE;
}

/** What a booth wears for its accepted challenges. */
export interface AdventDecorations {
  /** Baubles hanging from the stall's name board, one a challenge, up to six. */
  ornaments: number;
  /** A string of lights along the front, from seven challenges. */
  lights: boolean;
  /** A star over the stall, from twelve. */
  star: boolean;
  /** A glowing sign, for all twenty-four. */
  sign: boolean;
}

/** How many ornaments a booth can wear before the lights go up. */
export const MAX_ORNAMENTS = 6;

/**
 * A booth's decorations for `count` accepted challenges: ornaments first, then
 * a string of lights, then a star after 12, then a glowing sign after 24.
 */
export function decorationsFor(count: number): AdventDecorations {
  const n = Math.max(0, Math.min(ADVENT_DAYS, Math.floor(count) || 0));
  return {
    ornaments: Math.min(n, MAX_ORNAMENTS),
    lights: n > MAX_ORNAMENTS,
    star: n >= 12,
    sign: n >= ADVENT_DAYS,
  };
}

/** A GitHub login, in lower case, as a booth's folder is named. */
const LOGIN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/;

/** The counts from untrusted JSON: well-formed logins in lower case, each with 1 to 24 challenges. */
export function cleanCounts(data: unknown): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!data || typeof data !== 'object' || Array.isArray(data)) return counts;
  for (const [login, count] of Object.entries(data as Record<string, unknown>)) {
    const lower = login.toLowerCase();
    if (LOGIN.test(lower) && isDay(count)) counts[lower] = count;
  }
  return counts;
}

declare const __ADVENT_COUNTS__: unknown;

/** How many accepted challenges each participant has, as the build found them. */
export const ADVENT_COUNTS: Readonly<Record<string, number>> = cleanCounts(
  typeof __ADVENT_COUNTS__ === 'undefined' ? {} : __ADVENT_COUNTS__,
);

/** How many accepted challenges a booth's owner has. */
export const adventCountFor = (
  login: string,
  counts: Readonly<Record<string, number>> = ADVENT_COUNTS,
) => (Object.hasOwn(counts, login.toLowerCase()) ? counts[login.toLowerCase()] : 0);
