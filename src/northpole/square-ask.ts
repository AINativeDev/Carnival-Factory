/**
 * What a square's drawing may ask of the page, from its `ask()`, which the
 * worker calls after each frame, on the frame a tap hits its button: `open`,
 * the number of one of its panel's links out, or `visit`, another of the North
 * Pole's places to go to on the map. Only the North Pole's own places have
 * links, only they may send a visitor on, and the page does either only just
 * after a real tap (visit-link-out.ts), so a booth asking does nothing
 * (ADR 0058, ADR 0063).
 */

/** The most links out a place has, the Academy's pretend booths included; an ask past it is ignored. */
const MOST_LINKS = 16;

/** What a square's `ask()` may answer. */
export interface SquareAsk {
  /** The number of the panel's link out to open, from 0. */
  open?: number;
  /** Another North Pole place to go to, by its id, such as `the-academy`. */
  visit?: string;
}

/** The link a drawing's answer asks for, or undefined for anything that isn't a whole number in range. */
export function readLinkAsk(value: unknown): number | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { open } = value as Record<string, unknown>;
  return typeof open === 'number' && Number.isInteger(open) && open >= 0 && open < MOST_LINKS
    ? open
    : undefined;
}

/** The place a drawing's answer asks to visit, or undefined for anything that isn't a plain place id. */
export function readVisitAsk(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { visit } = value as Record<string, unknown>;
  return typeof visit === 'string' && /^[a-z0-9-]{1,40}$/.test(visit) ? visit : undefined;
}

/** A drawing's answer as the page hears it: a link, a place, both, or undefined for neither. */
export function readAsk(value: unknown): SquareAsk | undefined {
  const open = readLinkAsk(value);
  const visit = readVisitAsk(value);
  if (open === undefined && visit === undefined) return undefined;
  return { ...(open === undefined ? {} : { open }), ...(visit === undefined ? {} : { visit }) };
}
