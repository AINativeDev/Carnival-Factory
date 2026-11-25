import './style.css';
import { attractionRegistry } from './northpole/attractions';
import { CLAIM_URL } from './northpole/links';
import { isPhone } from './northpole/camera';
import { LEVEL_THEMES, levelWorld } from './northpole/level';
import { levelOf, levels } from './northpole/levels';
import { startMap, type MapControls, type SquareKind, type StationEntry } from './northpole/map';
import type { SandboxedSquare } from './northpole/sandbox';
import type { NorthPoleSquare } from './northpole/square';
import { applyTheme, theme } from './northpole/theme';
import { boothRegistry } from './northpole/booths';
import { avatarPath } from './northpole/owners';
import { PEOPLES_CHOICE } from './northpole/peoples-choice-standings';
import { sitesToRemember } from './northpole/plots';
import { BOOTHS_PANEL, startBoothsPanel, type BoothsPanel } from './booths-hud';
import { openAdventHud } from './advent';
import { openFactoryHud, readFactoryStats, squareCounts } from './factory';
import { CHOICE_PANEL, renderChoice } from './peoples-choice-hud';
import { SQUARE_HISTORY } from './history';
import { levelLink, parseHash } from './route';
import { renderSeason } from './season-card';
import { openVisitHud, type VisitHud } from './visit-hud';
import { followPending, knownPending, loadSites, saveSites } from './pending';
import { keepUpToDate } from './updates';
import { startTopMenu } from './top-menu';
import { renderKeepPosted } from './keep-posted';

applyTheme();
keepUpToDate();

const app = document.querySelector<HTMLElement>('#app')!;
let stop: (() => void) | undefined;

/**
 * Calls `show` now, and again once a sandboxed square's frame has said its name
 * and description: until then the page only knows its id. The later call only
 * happens while the page that asked is still the one showing, so a square that
 * opens after you've moved on never writes over another page.
 */
function whenNamed(square: NorthPoleSquare, show: () => void) {
  show();
  const view = app.firstElementChild;
  if ('onReady' in square) {
    (square as SandboxedSquare).onReady(() => {
      if (view?.isConnected) show();
    });
  }
}

function renderGuide(
  list: Element,
  squares: NorthPoleSquare[],
  href: string,
  by: (id: string) => string,
) {
  for (const square of squares) {
    const item = document.createElement('li');
    item.innerHTML = `<a><span class="name"></span> <span class="owner"></span></a>`;
    item.querySelector('a')!.href = `#/${href}/${square.id}`;
    whenNamed(square, () => (item.querySelector('.name')!.textContent = square.name));
    item.querySelector('.owner')!.textContent = by(square.id);
    list.append(item);
  }
}

/** The square the Booths panel features at its top. Once #33 lands, it's the day's featured square. */
const FEATURED: { kind: SquareKind; id: string } = { kind: 'attraction', id: 'ferris-wheel' };

/** The owners whose avatars the build downloaded (scripts/download-avatars.ts), set by Vite. */
declare const __AVATARS__: string[];
const AVATARS: ReadonlySet<string> = new Set(typeof __AVATARS__ === 'object' ? __AVATARS__ : []);

/** The Booths panel on the map now. */
let panel: BoothsPanel | undefined;

/** Every level's platform at the sleigh station. */
const STATION: StationEntry[] = levels.map((entry) => ({
  login: entry.login,
  name: entry.name,
  color: entry.level ? LEVEL_THEMES[entry.level.theme].sign : theme.colors.muted,
  closed: !entry.level,
}));

/** The world on screen: the North Pole, or the login whose level it is. */
let shown: string | undefined;

/** Takes the sleigh: to a level, or home to the North Pole. */
const travel = (login: string | undefined) => (location.hash = login ? levelLink(login) : '#/');

function renderMap(focus?: { kind: SquareKind; id: string }) {
  document.body.dataset.view = 'map';
  shown = '';
  app.innerHTML = `
    <section class="map">
      <div class="map-frame">
        <canvas class="map-canvas" tabindex="0" aria-label="The North Pole. Walk with WASD or the arrow keys, or click where you'd like to go. Press E at a booth or an attraction to go inside, or at an open plot to claim it. Inside, Esc or walking out through the doorway leaves."></canvas>
        <p class="map-note" role="status" hidden></p>
        <button class="map-prompt" type="button" hidden></button>
        <a class="hud hud-tessl" href="#/factory">Built with Tessl</a>
        <button class="hud hud-back" type="button"><span aria-hidden="true">←</span> Back to the map</button>
        ${BOOTHS_PANEL}
        <details class="hud hud-controls">
          <summary>Controls</summary>
          <p>Walk with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys, <kbd>E</kbd> to visit or claim</p>
        </details>
        <div class="hud-actions">
          <button class="hud hud-claim" type="button">Claim a plot</button>
          <button class="hud hud-overview" type="button">Show the whole island</button>
        </div>
      </div>
      ${CHOICE_PANEL}
      <div class="visually-hidden">
        <p>
          Welcome to the North Pole. The attractions round the town square are part of the North
          Pole itself, and the stalls along the lanes each belong to one person. The plots marked
          "For claim" are waiting for a booth:
          <a href="${CLAIM_URL}" target="_blank" rel="noopener">claim your own</a>.
        </p>
        <nav class="map-guide" aria-label="Attractions">
          <h2>Attractions</h2>
          <ul class="attractions"></ul>
        </nav>
        <nav class="map-guide" aria-label="Booths">
          <h2>Booths</h2>
          <ul class="booths"></ul>
        </nav>
      </div>
    </section>`;

  renderChoice(app.querySelector<HTMLDetailsElement>('.choice')!, PEOPLES_CHOICE);
  renderGuide(app.querySelector('.attractions')!, attractionRegistry.all(), 'attraction', () => '');
  renderGuide(app.querySelector('.booths')!, boothRegistry.all(), 'booth', (id) => `@${id}`);

  const registry = focus?.kind === 'attraction' ? attractionRegistry : boothRegistry;
  if (focus && !registry.get(focus.id)) renderUnknown(app.querySelector('.map-note')!, focus);

  const canvas = app.querySelector('canvas')!;
  const started = startMap(
    app.querySelector('.map-frame')!,
    canvas,
    app.querySelector('.map-prompt')!,
    {
      attractions: attractionRegistry.all(),
      booths: boothRegistry.all(),
      onOpen: (kind, id) => (location.hash = `#/${kind}/${id}`),
      onLeave: () => closeCard(true),
      onSelect: (selected) => panel?.showSelected(selected),
      avatars: AVATARS,
      focus,
      pending: knownPending(),
      wereSites: loadSites(),
      levels: STATION,
      onTravel: travel,
    },
  );
  const boothIds = new Set(boothRegistry.all().map((square) => square.id));
  const stopPending = followPending((pending) => {
    started.setPending(pending);
    // A page from before a booth landed keeps its site in mind, so the page
    // that knows the booth still greets it.
    saveSites(sitesToRemember(loadSites(), started.sites, boothIds));
  });
  stop = () => {
    closeCard(false);
    stopPending();
    started.stop();
    panel?.stop();
    panel = undefined;
  };
  map = started;
  renderHud(started, canvas);
}

/**
 * The HUD over the map: the Booths panel (src/booths-hud.ts), Claim a plot,
 * which walks the player to the nearest open plot, and the button that shows
 * the whole island. The panels start open on a wide map and folded on a
 * phone's, judged by the map frame's width, as the camera judges it.
 */
function renderHud(map: MapControls, canvas: HTMLCanvasElement) {
  const wide = !isPhone(app.querySelector<HTMLElement>('.map-frame')!.clientWidth);
  for (const box of app.querySelectorAll<HTMLDetailsElement>('.hud-booths, .hud-controls'))
    box.open = wide;
  const overview = app.querySelector<HTMLButtonElement>('.hud-overview')!;
  const showOverview = () =>
    (overview.textContent = map.overview ? 'Back to the carnival' : 'Show the whole island');

  const featured = (FEATURED.kind === 'attraction' ? attractionRegistry : boothRegistry).get(
    FEATURED.id,
  );
  panel = startBoothsPanel(app.querySelector<HTMLDetailsElement>('.hud-booths')!, map, canvas, {
    attractions: attractionRegistry.all(),
    booths: boothRegistry.all(),
    featured: featured && { kind: FEATURED.kind, square: featured },
    whenNamed,
    onPicked: showOverview,
  });
  panel.showSelected(map.selected);

  backToTheMap(canvas);
  app.querySelector('.hud-claim')!.addEventListener('click', () => {
    map.walkToOpenPlot();
    canvas.focus();
  });
  overview.addEventListener('click', () => {
    map.toggleOverview();
    showOverview();
  });
}

/** Inside a square or on the factory's numbers, the top-left corner takes you back to the map. */
function backToTheMap(canvas: HTMLCanvasElement) {
  app.querySelector('.hud-back')!.addEventListener('click', () => {
    closeCard(true);
    canvas.focus({ preventScroll: true });
  });
}

/**
 * A participant's level: the map walking its world instead of the North
 * Pole's, with its own squares sandboxed on their stalls and the sleigh home.
 * A level that isn't there, or is closed for repairs, says so on the North
 * Pole's map instead, beside the sleigh station.
 */
function renderLevel(login: string, focus?: string) {
  const entry = levelOf(login);
  if (!entry?.level) {
    renderMap();
    const note = app.querySelector<HTMLElement>('.map-note')!;
    // From the address, so only ever set as text, and no longer than a login.
    const who = login.slice(0, 39);
    note.textContent = entry
      ? `@${who}'s level is closed for repairs.`
      : `There's no level for @${who} yet.`;
    note.hidden = false;
    return;
  }
  const { level } = entry;
  document.body.dataset.view = 'map';
  shown = login;
  app.innerHTML = `
    <section class="map">
      <div class="map-frame">
        <canvas class="map-canvas" tabindex="0"></canvas>
        <p class="map-note" role="status" hidden></p>
        <button class="map-prompt" type="button" hidden></button>
        <button class="hud hud-back" type="button"><span aria-hidden="true">←</span> Back to the map</button>
        <section class="hud hud-level">
          <h1 class="level-name"></h1>
          <p class="level-owner"></p>
          <p class="level-description"></p>
          <a class="level-home" href="#/">Back to the North Pole</a>
        </section>
        <details class="hud hud-controls" open>
          <summary>Controls</summary>
          <p>Walk with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys, <kbd>E</kbd> to visit a square or ride the sleigh home</p>
        </details>
      </div>
    </section>`;
  const canvas = app.querySelector('canvas')!;
  canvas.setAttribute(
    'aria-label',
    `${level.name}, @${login}'s level. Walk with WASD or the arrow keys, or click where you'd like to go. Press E at a square to go inside, or at the sleigh to go back to the North Pole.`,
  );
  app.querySelector('.level-name')!.textContent = level.name;
  app.querySelector('.level-owner')!.textContent = `A level by @${login}`;
  app.querySelector('.level-description')!.textContent = level.description;
  const known = focus && entry.squares.some((square) => square.id === focus);
  if (focus && !known) renderUnknownInLevel(login, focus);
  const started = startMap(
    app.querySelector('.map-frame')!,
    canvas,
    app.querySelector('.map-prompt')!,
    {
      attractions: entry.squares,
      booths: [],
      level: {
        id: login,
        name: level.name,
        world: levelWorld(level),
        tint: LEVEL_THEMES[level.theme].tint,
      },
      onOpen: (_kind, id) => (location.hash = `#/level/${login}/${id}`),
      onLeave: () => closeCard(true),
      onTravel: travel,
      focus: known ? { kind: 'attraction', id: focus } : undefined,
    },
  );
  stop = () => {
    closeCard(false);
    started.stop();
  };
  map = started;
  backToTheMap(canvas);
}

/** A level's note for a link to one of its squares that isn't there. The id is only ever set as text. */
function renderUnknownInLevel(login: string, id: string) {
  const note = app.querySelector<HTMLElement>('.map-note')!;
  note.textContent = `${levelOf(login)?.name ?? login} has no square called "${id.slice(0, 40)}".`;
  note.hidden = false;
}

/** In the level on screen, puts the player in front of one of its squares, or says it isn't there. */
function jumpInLevel(login: string, id: string) {
  if (!levelOf(login)?.squares.some((square) => square.id === id))
    return renderUnknownInLevel(login, id);
  app.querySelector<HTMLElement>('.map-note')!.hidden = true;
  map?.jumpTo('attraction', id);
}

/** The map's note for a deep link to a square that isn't there. The id is only ever set as text. */
function renderUnknown(note: HTMLElement, focus: { kind: SquareKind; id: string }) {
  if (focus.kind === 'attraction') {
    note.textContent = `The North Pole has no attraction called "${focus.id}".`;
  } else {
    note.textContent = `There's no booth for @${focus.id} yet. `;
    const claim = document.createElement('a');
    claim.href = CLAIM_URL;
    claim.target = '_blank';
    claim.rel = 'noopener';
    claim.textContent = 'Claim it!';
    note.append(claim);
  }
  note.hidden = false;
}

/** The map running now, the HUD of the square the player is inside or of the factory's numbers, and how they came in. */
let map: MapControls | undefined;
let card: VisitHud | undefined;
/**
 * Whether the address behind this visit's in history is the map's, so going
 * back leaves it: true only when the visit began with a change of address
 * made from the map, not from another square.
 */
let cardFromHistory = false;
/** A hash change this page made itself, while leaving a square, for `route` to let pass. */
let ignoreNextRoute = false;

/** The booth a shared link brought this visitor to, invited to build their own until they close or claim. */
const arrival = parseHash(location.hash);
let invite: string | undefined =
  arrival.view === 'square' && arrival.kind === 'booth'
    ? arrival.id
    : arrival.view === 'map' && arrival.focus?.kind === 'booth'
      ? arrival.focus.id
      : undefined;

/** Leaves the square the player is inside, or the factory's numbers or the advent calendar. `address` says to take the address back off it, too. */
function closeCard(address: boolean) {
  if (!card) return;
  card.close();
  card = undefined;
  map?.leave();
  invite = undefined;
  if (!address) return;
  if (cardFromHistory) {
    ignoreNextRoute = true;
    history.back();
  } else {
    history.replaceState(null, '', shown ? levelLink(shown) : '#/');
  }
}

/** Takes the player inside a square, or says, on the map, that it isn't there. */
function visit(kind: SquareKind, id: string, fromHistory: boolean) {
  const square = shown
    ? levelOf(shown)?.squares.find((one) => one.id === id)
    : (kind === 'attraction' ? attractionRegistry : boothRegistry).get(id);
  // From one square straight to another, the address behind is the first square's, not the map's.
  const fromMap = fromHistory && !card;
  closeCard(false);
  if (!square || !map?.visit(kind, id)) {
    if (shown) renderUnknownInLevel(shown, id);
    else renderUnknown(app.querySelector('.map-note')!, { kind, id });
    return;
  }
  app.querySelector<HTMLElement>('.map-note')!.hidden = true;
  cardFromHistory = fromMap;
  card = openVisitHud(app.querySelector('.map-frame')!, {
    kind,
    square,
    level: shown || undefined,
    invite: kind === 'booth' && invite === id,
    avatar: kind === 'booth' && AVATARS.has(id) ? avatarPath(id) : undefined,
    onMine: () => panel?.setMe(id),
    onClose: () => closeCard(true),
    onClaim: () => {
      closeCard(true);
      map?.claimNextDoor();
      app.querySelector<HTMLElement>('.map-canvas')?.focus({ preventScroll: true });
    },
  });
}

/** Shows the factory's numbers over the map. */
function showFactory(fromHistory: boolean) {
  const fromMap = fromHistory && !card;
  closeCard(false);
  cardFromHistory = fromMap;
  card = openFactoryHud(app.querySelector('.map-frame')!, {
    squares: squareCounts(
      boothRegistry.all().map((square) => square.id),
      attractionRegistry.all().map((square) => square.id),
    ),
    stats: readFactoryStats(SQUARE_HISTORY?.factory),
    onClose: () => closeCard(true),
  });
}

/** Shows the advent calendar over the map. */
function showAdvent(fromHistory: boolean) {
  const fromMap = fromHistory && !card;
  closeCard(false);
  cardFromHistory = fromMap;
  card = openAdventHud(app.querySelector('.map-frame')!, {
    now: new Date(),
    onClose: () => closeCard(true),
  });
}

function route(event?: HashChangeEvent) {
  if (ignoreNextRoute) {
    ignoreNextRoute = false;
    return;
  }
  const fromHistory = event !== undefined;

  if (location.hash === '#/keep-posted') {
    closeCard(false);
    stop?.();
    stop = map = undefined;
    return renderKeepPosted(app);
  }

  const route = parseHash(location.hash);
  // Booths used to be called plots: keep links shared before the rename working.
  if (route.view === 'legacy') return location.replace(`#/booth/${route.id}`);

  if (route.view === 'season') {
    closeCard(false);
    stop?.();
    map = undefined;
    stop = renderSeason(app, route.login);
    return;
  }

  // A level opens its own world, or, already on screen, takes the player into
  // one of its squares, out of one, or in front of one.
  if (route.view === 'level') {
    if (!map || shown !== route.login) {
      closeCard(false);
      stop?.();
      stop = map = undefined;
      renderLevel(route.login, route.focus);
    } else if (!route.inside && card) {
      closeCard(false);
      if (route.focus) jumpInLevel(route.login, route.focus);
    } else if (route.focus) {
      jumpInLevel(route.login, route.focus);
    }
    if (route.inside && shown === route.login) visit('attraction', route.inside, fromHistory);
    return;
  }

  // Coming back from a level, the North Pole starts again.
  if (map && shown !== '') {
    closeCard(false);
    stop?.();
    stop = map = undefined;
  }

  // A square takes the player inside it, starting the world if it isn't running.
  if (route.view === 'square') {
    if (!map) {
      // Coming from a page without the map, such as a season card: stop it first.
      stop?.();
      renderMap();
    }
    return visit(route.kind, route.id, fromHistory);
  }

  if (route.view === 'factory') {
    if (!map) {
      stop?.();
      renderMap();
    }
    return showFactory(fromHistory);
  }

  if (route.view === 'advent') {
    if (!map) {
      stop?.();
      renderMap();
    }
    return showAdvent(fromHistory);
  }

  // Back from a visit, or See it on the map: the player comes out, and the world stays.
  if (map && card) {
    closeCard(false);
    if (route.focus) map.jumpTo(route.focus.kind, route.focus.id);
    return;
  }
  stop?.();
  stop = map = undefined;
  renderMap(route.focus);
}

window.addEventListener('hashchange', route);
route();
startTopMenu(location.hash);
