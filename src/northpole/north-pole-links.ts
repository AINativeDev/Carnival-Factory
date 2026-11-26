/**
 * Links out of the map for the North Pole's own places: the Factory's
 * signup, the Academy's lessons, the podcast and the YouTube channel, and AI
 * DevCon's tickets. A square runs sandboxed and
 * can't link anywhere, and a level is a participant's plain data, so these
 * live here, in maintainer code, keyed by a North Pole level's id: no
 * participant's level can ever carry one (ADR 0038).
 */
import { SETTINGS } from '../settings';
import { withUtm, YEAR_IN_REVIEW_URL } from './links';
import { landmarkLevel } from './north-pole-levels';

/** One link out: what its button says, and where it goes. */
export interface OutboundLink {
  readonly label: string;
  readonly href: string;
}

/** Each North Pole place's links, by its level's or attraction's id, in the order its panel shows them. */
export const NORTH_POLE_LINKS: Readonly<Record<string, readonly OutboundLink[]>> = {
  'the-factory': [{ label: 'Sign up for Tessl', href: SETTINGS.tessl.signup }],
  'the-academy': [{ label: 'Start the Academy', href: SETTINGS.tessl.academy }],
  'the-studio': [
    { label: 'Listen to the podcast', href: SETTINGS.tessl.podcast },
    { label: 'Watch on YouTube', href: SETTINGS.tessl.youtube },
  ],
  // The Year in Review's form, where a visitor's answer starts (ADR 0047).
  'the-year-in-review': [{ label: 'Add your answer', href: YEAR_IN_REVIEW_URL }],
  // AI DevCon's own room, which its billboard on the map opens (ADR 0058).
  'ai-devcon': [{ label: 'Get tickets', href: SETTINGS.aiDevcon.tickets }],
};

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

/** A place's links out: its own when it's one of the North Pole's, and none for anyone else's. */
export function northPoleLinks(level: string): readonly OutboundLink[] {
  // Only the list's own keys are looked up, so a name like "constructor" never reaches the object.
  const links = Object.hasOwn(NORTH_POLE_LINKS, level) ? NORTH_POLE_LINKS[level] : undefined;
  return links
    ? httpsOnly(links).map(({ label, href }) => ({ label, href: tagged(href, level) }))
    : [];
}

/**
 * Which place a panel's links come from: a level's own panel, a landmark's
 * room, one of a level's squares, or an attraction with links of its own. The links themselves come from
 * `northPoleLinks`, so a participant's level still gets none.
 */
export function linksHome(kind: string, id: string, level?: string): string | undefined {
  if (kind === 'level') return id;
  // An attraction with no level of its own, such as AI DevCon, may have links of its own.
  const own = kind === 'attraction' && Object.hasOwn(NORTH_POLE_LINKS, id) ? id : undefined;
  return landmarkLevel(kind, id) ?? level ?? own;
}

/**
 * Every address a link out may open, each tagged as its panel shows it: the
 * one place `window.open` takes an address from (visit-link-out.ts). The
 * address returned is the list's own string, never the one asked about, so
 * nothing from a page's address or a square's message can reach a new tab.
 */
const EVERY_LINK_OUT: readonly string[] = Object.keys(NORTH_POLE_LINKS).flatMap((place) =>
  northPoleLinks(place).map(({ href }) => href),
);

/** The list's own copy of `href`, if it's one of the North Pole's links out, else undefined. */
export const allowedLinkOut = (href: string): string | undefined =>
  EVERY_LINK_OUT.find((allowed) => allowed === href);
