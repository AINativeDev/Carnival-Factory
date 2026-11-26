import type { SquareKind } from './northpole/map-options';
import { isOn } from './feature-flags';
import { landmarkLevel } from './northpole/north-pole-levels';

/**
 * A booth's owner or an attraction's id, as the URL may name it. Squares are
 * named in lower case, so a deep link is read in lower case too.
 */
const ID = /^[\w-]+$/;

/**
 * What the page's hash asks for: the map, perhaps focused on one square; the
 * player inside one square, in the world; the factory's numbers or the advent
 * calendar over the map;
 * or a link shared from before booths were called spots.
 */
export type Route =
  | { view: 'map'; focus?: { kind: SquareKind; id: string } }
  | { view: 'square'; kind: SquareKind; id: string }
  | { view: 'season'; login: string }
  | { view: 'factory' }
  | { view: 'advent' }
  | { view: 'level'; login: string; focus?: string; inside?: string }
  | { view: 'legacy'; id: string };

/**
 * Reads a hash such as `#/booth/<login>`, `#/attraction/<id>`, a participant's
 * season card `#/season/<login>`, or the map's
 * deep links `#/?booth=<login>` and `#/?attraction=<id>`, or `#/factory`, or `#/advent`. Anything it doesn't
 * know, a malformed name included, is the plain map. A level opens at
 * `#/level/<login>`, in front of one of its squares at
 * `#/level/<login>?square=<id>`, and inside one at `#/level/<login>/<id>`.
 */
export function parseHash(hash: string): Route {
  if (hash === '#/factory') return { view: 'factory' };
  // The advent calendar waits for its feature flag: until then its link is the plain map.
  if (hash === '#/advent') return isOn('advent') ? { view: 'advent' } : { view: 'map' };

  const level = hash.match(/^#\/level\/([\w-]+)(?:\/([\w-]+)|\?(.*))?$/);
  if (level) {
    const login = level[1].toLowerCase();
    if (level[2]) return { view: 'level', login, inside: level[2].toLowerCase() };
    const square = new URLSearchParams(level[3] ?? '').get('square');
    return square !== null && ID.test(square)
      ? { view: 'level', login, focus: square.toLowerCase() }
      : { view: 'level', login };
  }

  const legacy = hash.match(/^#\/spot\/([\w-]+)$/);
  if (legacy) return { view: 'legacy', id: legacy[1] };

  const page = hash.match(/^#\/(booth|attraction)\/([\w-]+)$/);
  if (page) return { view: 'square', kind: page[1] as SquareKind, id: page[2] };

  const season = hash.match(/^#\/season\/([\w-]+)$/);
  if (season) return { view: 'season', login: season[1].toLowerCase() };

  const query = hash.match(/^#\/?\?(.*)$/);
  if (!query) return { view: 'map' };
  const params = new URLSearchParams(query[1]);
  for (const kind of ['booth', 'attraction'] as const) {
    const id = params.get(kind);
    if (id !== null)
      return ID.test(id) ? { view: 'map', focus: { kind, id: id.toLowerCase() } } : { view: 'map' };
  }
  return { view: 'map' };
}

/** The hash that opens the map showing one square. */
export function deepLink(kind: SquareKind, id: string): string {
  return `#/?${kind}=${encodeURIComponent(id)}`;
}

/** The hash of a participant's season card. */
export function seasonLink(login: string): string {
  return `#/season/${encodeURIComponent(login)}`;
}

/** The hash that opens a level, perhaps in front of one of its squares. */
export function levelLink(login: string, square?: string): string {
  const base = `#/level/${encodeURIComponent(login)}`;
  return square ? `${base}?square=${encodeURIComponent(square)}` : base;
}

/**
 * The hash that opens a square from the map: its room, or, for a landmark, its
 * level. A landmark's own `#/attraction/<id>` still shows its room (ADR 0035).
 */
export function squareLink(kind: SquareKind, id: string): string {
  const level = landmarkLevel(kind, id);
  return level ? levelLink(level) : `#/${kind}/${encodeURIComponent(id)}`;
}
