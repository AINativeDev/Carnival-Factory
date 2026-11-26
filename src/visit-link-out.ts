/**
 * Opens a link out when a North Pole place's drawing asks for one, from
 * inside its game (square-ask.ts, ADR 0058): the drawing can't open anything
 * itself, running sandboxed. Only the place's own links can open
 * (`northPoleLinks`), so a booth asking gets nothing, and only just after a
 * real tap on the page, one tab a tap, so no square can open tabs by itself.
 */
import type { SquareKind } from './northpole/map-options';
import { linksHome, northPoleLinks } from './northpole/north-pole-links';
import type { SandboxedSquare } from './northpole/sandbox';

/** How soon after a tap on the page a drawing's ask still counts as that tap's, in milliseconds. */
const AFTER_A_TAP = 1500;

/** Follows `square`'s asks for its links while a visit lasts; `stop` ends it. */
export function followLinkAsks(
  frame: HTMLElement,
  square: object,
  kind: SquareKind | 'level',
  id: string,
  level?: string,
) {
  const links = northPoleLinks(linksHome(kind, id, level) ?? '');
  if (!links.length || !('onLink' in square)) return { stop: () => undefined };
  let tapped = Number.NEGATIVE_INFINITY;
  const onTap = () => {
    tapped = performance.now();
  };
  frame.addEventListener('pointerdown', onTap, true);
  const stopListening = (square as SandboxedSquare).onLink((link) => {
    const out = links.at(link);
    if (!out || performance.now() - tapped > AFTER_A_TAP) return;
    tapped = Number.NEGATIVE_INFINITY;
    window.open(out.href, '_blank', 'noopener');
  });
  return {
    stop() {
      frame.removeEventListener('pointerdown', onTap, true);
      stopListening();
    },
  };
}
