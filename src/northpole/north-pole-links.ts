/**
 * Links out of the map for the North Pole's own levels: the Academy's
 * lessons, the podcast and the YouTube channel. A square runs sandboxed and
 * can't link anywhere, and a level is a participant's plain data, so these
 * live here, in maintainer code, keyed by a North Pole level's id: no
 * participant's level can ever carry one (ADR 0038).
 */
import { isNorthPoleLevel, landmarkLevel } from './north-pole-levels';

/** One link out: what its button says, and where it goes. */
export interface OutboundLink {
  readonly label: string;
  readonly href: string;
}

/** Each North Pole level's links, in the order its panel shows them. */
export const NORTH_POLE_LINKS: Readonly<Record<string, readonly OutboundLink[]>> = {
  'the-academy': [{ label: 'Start the Academy', href: 'https://tessl.io/academy' }],
  'the-studio': [
    { label: 'Listen to the podcast', href: 'https://tessl.io/podcast/' },
    { label: 'Watch on YouTube', href: 'https://www.youtube.com/@tessl-ai' },
  ],
};

/** Whether a link is an https address: anything else, such as `javascript:`, never reaches the page. */
function isHttps(href: string): boolean {
  try {
    return new URL(href).protocol === 'https:';
  } catch {
    return false;
  }
}

/** Only the links whose address is https. */
export const httpsOnly = (links: readonly OutboundLink[]) =>
  links.filter(({ href }) => isHttps(href));

/** A level's links out: its own when it's one of the North Pole's, and none for anyone else's. */
export function northPoleLinks(level: string): readonly OutboundLink[] {
  // Only the North Pole's own ids are looked up, so a name like "constructor" never reaches the object.
  const links = isNorthPoleLevel(level) ? NORTH_POLE_LINKS[level] : undefined;
  return links ? httpsOnly(links) : [];
}

/**
 * Which level a panel's links come from: a level's own panel, a landmark's
 * room, or one of a level's squares. The links themselves come from
 * `northPoleLinks`, so a participant's level still gets none.
 */
export function linksHome(kind: string, id: string, level?: string): string | undefined {
  if (kind === 'level') return id;
  return landmarkLevel(kind, id) ?? level;
}
