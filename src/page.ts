/**
 * What the page has on screen, and the panels over its map: the square the
 * player is inside, the factory's numbers or the advent calendar. One shared
 * state, so the router (src/router.ts) and the pages it opens
 * (src/map-page.ts, src/level-page.ts) agree on what's showing, and a panel
 * closes the same way whoever opened it.
 */
import { openAdventHud } from './advent';
import type { BoothsPanel } from './booths-hud';
import { the } from './dom';
import { openFactoryHud } from './factory';
import { readFactoryStats, squareCounts } from './factory-figures';
import { SQUARE_HISTORY } from './history';
import { renderUnknown, renderUnknownInLevel } from './map-notes';
import { attractionRegistry } from './northpole/attractions';
import { boothRegistry } from './northpole/booths';
import { levelOf } from './northpole/levels';
import type { MapControls, SquareKind } from './northpole/map';
import { levelLink } from './route';
import { openVisitHud, type VisitHud } from './visit-hud';

export interface Page {
  readonly app: HTMLElement;
  /** The owners whose avatars the build downloaded. */
  readonly avatars: ReadonlySet<string>;
  /** Stops what's on screen: the map, or a page of its own. */
  stop: (() => void) | undefined;
  /** The map running now. */
  map: MapControls | undefined;
  /** The Booths panel on the map now. */
  panel: BoothsPanel | undefined;
  /** The HUD of the square the player is inside, or of the factory's numbers or the advent calendar. */
  card: VisitHud | undefined;
  /** The world on screen: '' for the North Pole, or the login whose level it is. */
  shown: string | undefined;
  /** Whether going back leaves this visit for the map: only when it began with a change of address made on the map. */
  cardFromHistory: boolean;
  /** A hash change this page made itself, while leaving a square, for the router to let pass. */
  ignoreNextRoute: boolean;
  /** The booth a shared link brought this visitor to, invited to build their own until they close or claim. */
  invite: string | undefined;
}

/** Leaves the square the player is inside, or the factory's numbers or the advent calendar. `address` says to take the address back off it, too. */
export function closeCard(page: Page, address: boolean) {
  if (!page.card) return;
  page.card.close();
  page.card = undefined;
  page.map?.leave();
  page.invite = undefined;
  if (!address) return;
  if (page.cardFromHistory) {
    page.ignoreNextRoute = true;
    history.back();
  } else {
    history.replaceState(null, '', page.shown ? levelLink(page.shown) : '#/');
  }
}

/** Closes the panel open now, for another, remembering whether the address came from the map. */
function openOver(page: Page, fromHistory: boolean) {
  // From one square straight to another, the address behind is the first square's, not the map's.
  const fromMap = fromHistory && !page.card;
  closeCard(page, false);
  return fromMap;
}

/** Takes the player inside a square, or says, on the map, that it isn't there. */
export function visit(page: Page, kind: SquareKind, id: string, fromHistory: boolean) {
  const { app, shown } = page;
  const square = shown
    ? levelOf(shown)?.squares.find((one) => one.id === id)
    : (kind === 'attraction' ? attractionRegistry : boothRegistry).get(id);
  const fromMap = openOver(page, fromHistory);
  if (!square || !page.map?.visit(kind, id)) {
    if (shown) renderUnknownInLevel(app, shown, id);
    else renderUnknown(the(app, '.map-note', HTMLElement), { kind, id });
    return;
  }
  the(app, '.map-note', HTMLElement).hidden = true;
  page.cardFromHistory = fromMap;
  page.card = openVisitHud(the(app, '.map-frame', HTMLElement), {
    kind,
    square,
    ...(shown ? { level: shown } : {}),
    invite: kind === 'booth' && page.invite === id,
    // Their own booth's panel offers them a level next (ADR 0048).
    mine: !shown && kind === 'booth' && page.panel?.me === id,
    onMine: () => {
      page.panel?.setMe(id);
    },
    onClose: () => {
      closeCard(page, true);
    },
    onClaim: () => {
      closeCard(page, true);
      page.map?.claimNextDoor();
      app.querySelector<HTMLElement>('.map-canvas')?.focus({ preventScroll: true });
    },
  });
}

/** Shows the factory's numbers over the map. */
export function showFactory(page: Page, fromHistory: boolean) {
  page.cardFromHistory = openOver(page, fromHistory);
  page.card = openFactoryHud(the(page.app, '.map-frame', HTMLElement), {
    squares: squareCounts(
      boothRegistry.all().map((square) => square.id),
      // Stryker disable next-line ArrowFunction: only how many attractions there are is counted, never their ids
      attractionRegistry.all().map((square) => square.id),
    ),
    stats: readFactoryStats(SQUARE_HISTORY?.factory),
    onClose: () => {
      closeCard(page, true);
    },
  });
}

/** Shows the advent calendar over the map. */
export function showAdvent(page: Page, fromHistory: boolean) {
  page.cardFromHistory = openOver(page, fromHistory);
  page.card = openAdventHud(the(page.app, '.map-frame', HTMLElement), {
    now: new Date(),
    onClose: () => {
      closeCard(page, true);
    },
  });
}
