/**
 * What a square's drawing may ask of the page, from its `ask()`, which the
 * worker calls after each frame: `open`, the number of one of its panel's
 * links out, on the frame a tap hits its button. Only the North Pole's own places have links (north-pole-links.ts),
 * and the page opens one only just after a real tap (visit-link-out.ts), so a
 * booth asking does nothing (ADR 0058).
 */

/** The most links out a place has; an ask past it is ignored. */
const MOST_LINKS = 8;

/** What a square's `ask()` may answer. */
export interface SquareAsk {
  /** The number of the panel's link out to open, from 0. */
  open?: number;
}

/** The link a drawing's answer asks for, or undefined for anything that isn't a whole number in range. */
export function readLinkAsk(value: unknown): number | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { open } = value as Record<string, unknown>;
  return typeof open === 'number' && Number.isInteger(open) && open >= 0 && open < MOST_LINKS
    ? open
    : undefined;
}
