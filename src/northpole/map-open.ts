/**
 * What picking and opening a plot does: a square opens, a platform takes the
 * sleigh, an open plot or a construction site opens its form or its request.
 * The keys, clicks, the prompt and the page's own controls all end here, so
 * opening means the same whichever way the visitor asked.
 */
import { platformLabel } from './map-labels';
import type { SquareKind } from './map-options';
import { remembered, type MapRun } from './map-state';
import { CLAIM_URL, REPO_URL } from './links';
import { type Plot } from './world';
import { plotAtDoor } from './walking';

/** Opens a link in a new tab: the Claim your booth form by default. */
function claim(href = CLAIM_URL) {
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.click();
}

/** Opens what stands on a plot, remembering where the player stood for when they come back. */
export function open(m: MapRun, plot: Plot) {
  if (plot.kind === 'open') {
    claim();
    return;
  }
  if (plot.kind === 'site') {
    const entry = m.pending.get(String(plot.id));
    claim(entry ? `${REPO_URL}/issues/${String(entry.issue)}` : CLAIM_URL);
    return;
  }
  remembered.set(m.place, { ...m.player });
  if (plot.kind === 'exit') {
    m.options.onTravel?.(undefined);
    return;
  }
  if (plot.kind === 'platform') {
    if (!platformLabel(m, plot).closed) m.options.onTravel?.(plot.id);
    return;
  }
  // A booth's or an attraction's plot always has its id.
  m.options.onOpen(plot.kind, String(plot.id));
}

/** The picked square as the page names it. */
export const named = (plot: Plot) => ({ kind: plot.kind as SquareKind, id: String(plot.id) });

/** Picks a plot, or lets go of the one picked, and tells the page. */
export function select(m: MapRun, plot: Plot | undefined) {
  if (plot === m.selected) return;
  m.selected = plot;
  m.selectedAt = undefined;
  m.trailing = false;
  m.options.onSelect?.(plot && named(plot));
}

/** Opens a plot from the map: from afar, the player goes to its door first. */
export function enter(m: MapRun, plot: Plot) {
  if (plotAtDoor(m.world, m.player) !== plot) {
    m.player = { ...plot.door };
    m.path = [];
  }
  open(m, plot);
}
