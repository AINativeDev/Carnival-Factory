/**
 * The page's router: reads the address's hash (src/route.ts) and puts the
 * page there, the North Pole's map, a level, a square, the factory's numbers,
 * the advent calendar or a page of its own, keeping the world running when it
 * only needs to move the player. Every page it opens shares one state
 * (src/page.ts).
 */
import { renderKeepPosted } from './keep-posted';
import { jumpInLevel, renderLevel } from './level-page';
import { renderMap } from './map-page';
import { closeCard, showAdvent, showFactory, visit, type Page } from './page';
import { parseHash, type Route } from './route';
import { renderSeason } from './season-card';

/** Leaves the world on screen, and anything over it, for another page. */
function leaveWorld(page: Page) {
  closeCard(page, false);
  page.stop?.();
  page.stop = page.map = undefined;
}

/** Starts the North Pole's map if no map is running, such as after a season card. */
function needMap(page: Page) {
  if (page.map) return;
  page.stop?.();
  renderMap(page);
}

/**
 * A level opens its own world, or, already on screen, takes the player into
 * one of its squares, out of one, or in front of one.
 */
function routeLevel(page: Page, route: Extract<Route, { view: 'level' }>, fromHistory: boolean) {
  if (!page.map || page.shown !== route.login) {
    leaveWorld(page);
    renderLevel(page, route.login, route.focus);
  } else if (!route.inside && page.card) {
    closeCard(page, false);
    if (route.focus) jumpInLevel(page, route.login, route.focus);
  } else if (route.focus) {
    jumpInLevel(page, route.login, route.focus);
  }
  if (route.inside && page.shown === route.login)
    visit(page, 'attraction', route.inside, fromHistory);
}

/** On the North Pole: inside a square, the factory's numbers, the advent calendar, or the map. */
function routeNorthPole(
  page: Page,
  route: Extract<Route, { view: 'map' | 'square' | 'factory' | 'advent' }>,
  fromHistory: boolean,
) {
  // Coming back from a level, the North Pole starts again.
  if (page.map && page.shown !== '') leaveWorld(page);

  if (route.view === 'square') {
    needMap(page);
    visit(page, route.kind, route.id, fromHistory);
  } else if (route.view === 'factory') {
    needMap(page);
    showFactory(page, fromHistory);
  } else if (route.view === 'advent') {
    needMap(page);
    showAdvent(page, fromHistory);
  } else if (page.map && page.card) {
    // Back from a visit, or See it on the map: the player comes out, and the world stays.
    closeCard(page, false);
    if (route.focus) page.map.jumpTo(route.focus.kind, route.focus.id);
  } else {
    page.stop?.();
    page.stop = page.map = undefined;
    renderMap(page, route.focus);
  }
}

/** Puts the page where the address says. `event` is the hash change, when there was one. */
export function route(page: Page, event?: HashChangeEvent) {
  if (page.ignoreNextRoute) {
    page.ignoreNextRoute = false;
    return;
  }
  const fromHistory = event !== undefined;
  if (location.hash === '#/keep-posted') {
    leaveWorld(page);
    renderKeepPosted(page.app);
    return;
  }
  const next = parseHash(location.hash);
  if (next.view === 'legacy') {
    // Booths used to be called spots: keep links shared before the rename working.
    // Only ever a hash on this page, the id encoded: it can't lead anywhere else.
    location.replace(`#/booth/${encodeURIComponent(next.id)}`);
  } else if (next.view === 'season') {
    leaveWorld(page);
    page.stop = renderSeason(page.app, next.login);
  } else if (next.view === 'level') {
    routeLevel(page, next, fromHistory);
  } else {
    routeNorthPole(page, next, fromHistory);
  }
}

/** The booth a shared link brought this visitor to, invited to build their own until they close or claim. */
function invitedBy(arrival: Route): string | undefined {
  if (arrival.view === 'square' && arrival.kind === 'booth') return arrival.id;
  if (arrival.view === 'map' && arrival.focus?.kind === 'booth') return arrival.focus.id;
  return undefined;
}

/** Starts the page in `app`, where the address says, and follows the address from then on. */
export function startRouter(app: HTMLElement, avatars: ReadonlySet<string>): Page {
  const page: Page = {
    app,
    avatars,
    stop: undefined,
    map: undefined,
    panel: undefined,
    card: undefined,
    shown: undefined,
    cardFromHistory: false,
    ignoreNextRoute: false,
    invite: invitedBy(parseHash(location.hash)),
  };
  window.addEventListener('hashchange', (event) => {
    route(page, event);
  });
  route(page);
  return page;
}
