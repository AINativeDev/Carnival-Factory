/**
 * What picking and opening a spot does: a square opens, a platform takes the
 * sleigh, an open spot or a construction site opens its form or its request.
 * The keys, clicks, the prompt and the page's own controls all end here, so
 * opening means the same whichever way the visitor asked.
 */
import { platformLabel } from './map-labels';
import type { SquareKind } from './map-options';
import { remembered, type MapRun } from './map-state';
import { CLAIM_URL, REPO_URL } from './links';
import { type Spot } from './world';
import { spotAtDoor } from './walking';

/** Opens a link in a new tab: the Claim your booth form by default. */
function claim(href = CLAIM_URL) {
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.click();
}

/** Opens what stands on a spot, remembering where the player stood for when they come back. */
export function open(m: MapRun, spot: Spot) {
  if (spot.kind === 'open') {
    claim();
    return;
  }
  if (spot.kind === 'site') {
    const entry = m.pending.get(String(spot.id));
    claim(entry ? `${REPO_URL}/issues/${String(entry.issue)}` : CLAIM_URL);
    return;
  }
  remembered.set(m.place, { ...m.player });
  if (spot.kind === 'exit') {
    m.options.onTravel?.(undefined);
    return;
  }
  if (spot.kind === 'platform') {
    if (!platformLabel(m, spot).closed) m.options.onTravel?.(spot.id);
    return;
  }
  // A booth's or an attraction's spot always has its id.
  m.options.onOpen(spot.kind, String(spot.id));
}

/** The picked square as the page names it. */
export const named = (spot: Spot) => ({ kind: spot.kind as SquareKind, id: String(spot.id) });

/** Picks a spot, or lets go of the one picked, and tells the page. */
export function select(m: MapRun, spot: Spot | undefined) {
  if (spot === m.selected) return;
  m.selected = spot;
  m.selectedAt = undefined;
  m.trailing = false;
  m.options.onSelect?.(spot && named(spot));
}

/** Opens a spot from the map: from afar, the player goes to its door first. */
export function enter(m: MapRun, spot: Spot) {
  if (spotAtDoor(m.world, m.player) !== spot) {
    m.player = { ...spot.door };
    m.path = [];
  }
  open(m, spot);
}
