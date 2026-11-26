/**
 * Links out of the map for the North Pole's own levels: the Academy's
 * lessons, the podcast and the YouTube channel. A square runs sandboxed and
 * can't link anywhere, and a level is a participant's plain data, so these
 * live here, in maintainer code, keyed by a North Pole level's id: no
 * participant's level can ever carry one (ADR 0038).
 */
import { withUtm, YEAR_IN_REVIEW_URL } from './links';
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
  // The Year in Review's form, where a visitor's answer starts (ADR 0047).
  'the-year-in-review': [{ label: 'Add your answer', href: YEAR_IN_REVIEW_URL }],
};

/**
 * Where a landmark goes straight out to, in a new tab, while the levels flag
 * is off: the Factory, the Academy and the Studio open their own sites
 * instead of their levels, as the billboard opens its tickets (ADR 0055).
 */
const LANDMARK_LINKS_OUT: Readonly<Record<string, string>> = {
  'the-factory': 'https://tessl.io',
  'the-academy': 'https://tessl.io/academy',
  'the-studio': 'https://tessl.io/podcast/',
};

/** The site a landmark opens instead of its level, if it has one and it's https. */
export function landmarkLinkOut(kind: string, id: string): string | undefined {
  // Only the North Pole's own ids are looked up, so a name like "constructor" never reaches the object.
  const href = kind === 'attraction' && isNorthPoleLevel(id) ? LANDMARK_LINKS_OUT[id] : undefined;
  return href && isHttps(href) ? tagged(href, id) : undefined;
}

/**
 * A link out of a North Pole place, tagged with the place it sat in, so Tessl
 * can tell the carnival sent the visit. The Year in Review's form is this
 * repository's own, so it stays as it is.
 */
const tagged = (href: string, place: string) =>
  new URL(href).hostname === 'github.com' ? href : withUtm(href, place);

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
  return links
    ? httpsOnly(links).map(({ label, href }) => ({ label, href: tagged(href, level) }))
    : [];
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
