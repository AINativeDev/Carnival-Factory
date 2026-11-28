/**
 * Does what a North Pole place's drawing asks, from inside its game
 * (square-ask.ts, ADR 0058, ADR 0063): opens one of its links out, or sends
 * the visitor on to another North Pole place. The drawing can't do either
 * itself, running sandboxed. Only the place's own links open
 * (`northPoleLinks`) and only the North Pole's own places are visited
 * (`visitablePlace`), so a booth asking gets nothing, and only just after a
 * real tap on the page, one a tap, so no square can act by itself.
 */
import { isOn } from './feature-flags';
import type { SquareKind } from './northpole/map-options';
import {
  allowedLinkOut,
  linksHome,
  northPoleLinks,
  visitablePlace,
} from './northpole/north-pole-links';
import type { SandboxedSquare } from './northpole/sandbox';
import type { SquareAsk } from './northpole/square-ask';
import { squareLink } from './route';

/** How soon after a tap on the page a drawing's ask still counts as that tap's, in milliseconds. */
const AFTER_A_TAP = 1500;

/** Opens the link out `ask` names, else goes to the place it names; false when it names neither of the place's own. */
function act(ask: SquareAsk, links: ReturnType<typeof northPoleLinks>): boolean {
  // Only an address on the maintainers' own list opens, and it's the list's copy that does.
  // Stryker disable next-line StringLiteral: no text but a link on the list is allowed out, so any fallback opens nothing.
  const out = allowedLinkOut(ask.open === undefined ? '' : (links.at(ask.open)?.href ?? ''));
  if (out) {
    // deepcode ignore OR: `out` is a fixed address from NORTH_POLE_LINKS (allowedLinkOut), never one from the page's address or a square.
    window.open(out, '_blank', 'noopener');
    return true;
  }
  // Stryker disable next-line StringLiteral: no text but a place on the list is visited, so any fallback goes nowhere.
  const place = visitablePlace(ask.visit ?? '');
  if (!place) return false;
  location.hash = squareLink('attraction', place, isOn('levels'));
  return true;
}

/** Follows `square`'s asks for its links and places while a visit lasts; `stop` ends it. */
export function followAsks(
  frame: HTMLElement,
  square: object,
  kind: SquareKind | 'level',
  id: string,
  level?: string,
) {
  // Stryker disable next-line StringLiteral: no text but a North Pole place's name has links, so any fallback gives none.
  const links = northPoleLinks(linksHome(kind, id, level) ?? '');
  if (!links.length || !('onAsk' in square)) return { stop: () => undefined };
  let tapped = Number.NEGATIVE_INFINITY;
  const onTap = () => {
    tapped = performance.now();
  };
  frame.addEventListener('pointerdown', onTap, true);
  const stopListening = (square as SandboxedSquare).onAsk((ask) => {
    if (performance.now() - tapped > AFTER_A_TAP) return;
    if (act(ask, links)) tapped = Number.NEGATIVE_INFINITY;
  });
  return {
    stop() {
      frame.removeEventListener('pointerdown', onTap, true);
      stopListening();
    },
  };
}
