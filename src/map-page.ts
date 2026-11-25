/**
 * The North Pole's own map page: the walkable map with every booth and
 * attraction, the sleigh station's platforms for participants' levels, the HUD over it (the Booths
 * panel, Get a booth, the whole island) and People's Choice below it. The
 * router (src/router.ts) opens it; src/level-page.ts opens a level's instead.
 */
import { startBoothsPanel } from './booths-hud';
import { the } from './dom';
import { renderUnknown } from './map-notes';
import { NORTH_POLE_MAP, renderGuide, whenNamed } from './map-page-markup';
import { closeCard, type Page } from './page';
import { followPending, knownPending, loadSites, saveSites } from './pending';
import { renderChoice } from './peoples-choice-hud';
import { attractionRegistry } from './northpole/attractions';
import { boothRegistry } from './northpole/booths';
import { isPhone } from './northpole/camera';
import { LEVEL_THEMES } from './northpole/level';
import { levels } from './northpole/levels';
import { isNorthPoleLevel } from './northpole/north-pole-levels';
import { startMap, type MapControls, type SquareKind, type StationEntry } from './northpole/map';
import { PEOPLES_CHOICE } from './northpole/peoples-choice-standings';
import { sitesToRemember } from './northpole/plots';
import { theme } from './northpole/theme';
import { levelLink, squareLink } from './route';

/** The square the Booths panel features at its top. Once #33 lands, it's the day's featured square. */
const FEATURED: { kind: SquareKind; id: string } = { kind: 'attraction', id: 'ferris-wheel' };

/**
 * A platform at the sleigh station for every participant's level. The North
 * Pole's own levels have none: their landmark attraction is the way in (ADR 0042).
 */
const STATION: StationEntry[] = levels
  .filter((entry) => !isNorthPoleLevel(entry.login))
  .map((entry) => ({
    login: entry.login,
    name: entry.name,
    owner: entry.owner,
    color: entry.level ? LEVEL_THEMES[entry.level.theme].sign : theme.colors.muted,
    closed: !entry.level,
  }));

/** Takes the sleigh: to a level, or home to the North Pole. */
export const travel = (login: string | undefined) => {
  location.hash = login ? levelLink(login) : '#/';
};

/** Inside a square or on the factory's numbers, the top-left corner takes you back to the map. */
export function backToTheMap(page: Page, canvas: HTMLCanvasElement) {
  the(page.app, '.hud-back', HTMLElement).addEventListener('click', () => {
    closeCard(page, true);
    canvas.focus({ preventScroll: true });
  });
}

/** Shows the booths being built on the map, as they change. Returns how to stop. */
function followBuilding(map: MapControls) {
  const boothIds = new Set(boothRegistry.all().map((square) => square.id));
  return followPending((pending) => {
    map.setPending(pending);
    // A page from before a booth landed keeps its site in mind, so the page
    // that knows the booth still greets it.
    saveSites(sitesToRemember(loadSites(), map.sites, boothIds));
  });
}

/** The North Pole's map, perhaps showing one square, and the guide to every square under it. */
export function renderMap(page: Page, focus?: { kind: SquareKind; id: string }) {
  const { app } = page;
  document.body.dataset.view = 'map';
  page.shown = '';
  app.innerHTML = NORTH_POLE_MAP;

  renderChoice(the(app, '.choice', HTMLDetailsElement), PEOPLES_CHOICE);
  renderGuide(app, the(app, '.attractions', HTMLElement), attractionRegistry.all(), {
    href: 'attraction',
    by: () => '',
  });
  renderGuide(app, the(app, '.booths', HTMLElement), boothRegistry.all(), {
    href: 'booth',
    by: (id) => `@${id}`,
  });

  const registry = focus?.kind === 'attraction' ? attractionRegistry : boothRegistry;
  if (focus && !registry.get(focus.id)) renderUnknown(the(app, '.map-note', HTMLElement), focus);

  const canvas = the(app, 'canvas', HTMLCanvasElement);
  const pending = knownPending();
  /* v8 ignore next -- the page's wiring: squareLink is unit tested, and smoke/the-factory.spec.ts opens the landmark here */
  const started = startMap(
    the(app, '.map-frame', HTMLElement),
    canvas,
    the(app, '.map-prompt', HTMLButtonElement),
    {
      attractions: attractionRegistry.all(),
      booths: boothRegistry.all(),
      onOpen: (kind, id) => {
        location.hash = squareLink(kind, id);
      },
      onLeave: () => {
        closeCard(page, true);
      },
      onSelect: (selected) => {
        page.panel?.showSelected(selected);
      },
      avatars: page.avatars,
      ...(focus ? { focus } : {}),
      ...(pending ? { pending } : {}),
      wereSites: loadSites(),
      levels: STATION,
      onTravel: travel,
    },
  );
  const stopPending = followBuilding(started);
  page.stop = () => {
    closeCard(page, false);
    stopPending();
    started.stop();
    page.panel?.stop();
    page.panel = undefined;
  };
  page.map = started;
  renderHud(page, started, canvas);
}

/**
 * The HUD over the map: the Booths panel (src/booths-hud.ts), Get a booth,
 * which walks the player to the nearest free spot, and the button that shows
 * the whole island. The panels start open on a wide map and folded on a
 * phone's, judged by the map frame's width, as the camera judges it.
 */
function renderHud(page: Page, map: MapControls, canvas: HTMLCanvasElement) {
  const { app } = page;
  const wide = !isPhone(the(app, '.map-frame', HTMLElement).clientWidth);
  for (const box of app.querySelectorAll<HTMLDetailsElement>('.hud-booths, .hud-controls'))
    box.open = wide;
  const overview = the(app, '.hud-overview', HTMLButtonElement);
  const showOverview = () => {
    overview.textContent = map.overview ? 'Back to the carnival' : 'Show the whole island';
  };

  const registries = { attraction: attractionRegistry, booth: boothRegistry };
  const featured = registries[FEATURED.kind].get(FEATURED.id);
  page.panel = startBoothsPanel(the(app, '.hud-booths', HTMLDetailsElement), map, canvas, {
    attractions: attractionRegistry.all(),
    booths: boothRegistry.all(),
    featured: featured && { kind: FEATURED.kind, square: featured },
    whenNamed: (square, show) => {
      whenNamed(app, square, show);
    },
    onPicked: showOverview,
  });
  page.panel.showSelected(map.selected);

  backToTheMap(page, canvas);
  the(app, '.hud-claim', HTMLElement).addEventListener('click', () => {
    map.walkToOpenPlot();
    canvas.focus();
  });
  overview.addEventListener('click', () => {
    map.toggleOverview();
    showOverview();
  });
}
