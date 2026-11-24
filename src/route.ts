import type { SquareKind } from '../northpole/map';

/**
 * A booth's owner or an attraction's id, as the URL may name it. Squares are
 * named in lower case, so a deep link is read in lower case too.
 */
const ID = /^[\w-]+$/;

/**
 * What the page's hash asks for: the map, perhaps focused on one square; the
 * player inside one square, in the world; or a link shared from before booths
 * were called plots.
 */
export type Route =
  | { view: 'map'; focus?: { kind: SquareKind; id: string } }
  | { view: 'square'; kind: SquareKind; id: string }
  | { view: 'season'; login: string }
  | { view: 'legacy'; id: string };

/**
 * Reads a hash such as `#/booth/<login>`, `#/attraction/<id>`, a participant's
 * season card `#/season/<login>`, or the map's
 * deep links `#/?booth=<login>` and `#/?attraction=<id>`. Anything it doesn't
 * know, a malformed name included, is the plain map.
 */
export function parseHash(hash: string): Route {
  const legacy = hash.match(/^#\/plot\/([\w-]+)$/);
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
