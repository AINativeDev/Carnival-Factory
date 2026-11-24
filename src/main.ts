import './style.css';
import { attractionRegistry } from '../northpole/attractions';
import { CLAIM_URL, REPO_URL } from '../northpole/links';
import { isPhone } from '../northpole/camera';
import { startMap, type MapControls, type SquareKind } from '../northpole/map';
import type { SandboxedSquare } from '../northpole/sandbox';
import type { NorthPoleSquare } from '../northpole/square';
import { applyTheme } from '../northpole/theme';
import { boothRegistry } from '../northpole/booths';
import { parseHash } from './route';
import { openVisitCard, type VisitCard } from './visit-card';
import { keepUpToDate } from './updates';

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

/** A small walking-figure icon, drawn in the button's own colour. */
const WALK_ICON = `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor"><circle cx="9" cy="2.5" r="1.8"/><path d="M8 5.2 5.5 7.5 5 10.5h1.6l.4-2 1.2-1L7.5 11 5.3 15h1.9l1.9-3.4 1.6 3.4h1.8L10.2 11l.7-3.2.8 1.4 2.3.8.4-1.4-1.8-.6-1.4-2.4C10.7 5 9.2 4.6 8 5.2Z"/></svg>`;

function renderMap(focus?: { kind: SquareKind; id: string }) {
  document.body.dataset.view = 'map';
  app.innerHTML = `
    <section class="map">
      <div class="map-frame">
        <canvas class="map-canvas" tabindex="0" aria-label="The North Pole. Walk with WASD or the arrow keys, or click where you'd like to go. Press E at a booth or an attraction to visit it, or at an open plot to claim it."></canvas>
        <p class="map-note" role="status" hidden></p>
        <button class="map-prompt" type="button" hidden></button>
        <p class="hud hud-tessl">Built with Tessl</p>
        <details class="hud hud-booths">
          <summary>Booths</summary>
          <p class="hud-hint">Click one to go there, or shift-click to walk.</p>
          <div class="hud-featured" hidden></div>
          <h2 class="hud-group">Attractions</h2>
          <ul class="hud-list hud-attractions"></ul>
          <h2 class="hud-group">Booths</h2>
          <ul class="hud-list hud-stalls"></ul>
        </details>
        <details class="hud hud-controls">
          <summary>Controls</summary>
          <p>Walk with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys, <kbd>E</kbd> to visit or claim</p>
        </details>
        <div class="hud-actions">
          <button class="hud hud-claim" type="button">Claim a plot</button>
          <button class="hud hud-overview" type="button">Show the whole island</button>
        </div>
      </div>
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

  renderGuide(
    app.querySelector('.attractions')!,
    attractionRegistry.all(),
    'attraction',
    () => 'North Pole',
  );
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
      focus,
    },
  );
  stop = () => {
    closeCard(false);
    started.stop();
  };
  map = started;
  renderHud(started, canvas);
}

/**
 * The HUD over the map. In the Booths panel, the Featured entry and every
 * square's name jump straight to that square, and shift-click or the walk icon
 * walks there instead. Claim a plot walks the player to the nearest open plot,
 * and the last button shows the whole island. The panels start open on a wide
 * map and folded on a phone's, judged by the map frame's width, as the camera
 * judges it.
 */
function renderHud(map: MapControls, canvas: HTMLCanvasElement) {
  const wide = !isPhone(app.querySelector<HTMLElement>('.map-frame')!.clientWidth);
  for (const panel of app.querySelectorAll<HTMLDetailsElement>('.hud-booths, .hud-controls'))
    panel.open = wide;
  const overview = app.querySelector<HTMLButtonElement>('.hud-overview')!;
  const showOverview = () =>
    (overview.textContent = map.overview ? 'Back to the carnival' : 'Show the whole island');

  /** A square's entry: its name jumps there, and the walk icon walks there. */
  const entry = (kind: SquareKind, square: NorthPoleSquare, by: string, label = '') => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hud-go';
    button.dataset.kind = kind;
    button.dataset.id = square.id;
    button.innerHTML = `<span class="label"></span><span class="name"></span> <span class="owner"></span>`;
    button.querySelector('.label')!.textContent = label;
    button.querySelector('.owner')!.textContent = by;
    const walk = document.createElement('button');
    walk.type = 'button';
    walk.className = 'hud-walk';
    walk.innerHTML = WALK_ICON;
    whenNamed(square, () => {
      button.querySelector('.name')!.textContent = square.name;
      walk.title = `Walk to ${square.name}`;
      walk.setAttribute('aria-label', walk.title);
    });
    button.addEventListener('click', (event) => {
      if (event.shiftKey) {
        map.walkTo(kind, square.id);
        canvas.focus();
      } else {
        // Picking a square goes there and opens its visit card, in the world.
        map.jumpTo(kind, square.id);
        location.hash = `#/${kind}/${square.id}`;
      }
      showOverview();
    });
    walk.addEventListener('click', () => {
      map.walkTo(kind, square.id);
      canvas.focus();
    });
    item.append(button, walk);
    return item;
  };

  const featured = (FEATURED.kind === 'attraction' ? attractionRegistry : boothRegistry).get(
    FEATURED.id,
  );
  if (featured) {
    const box = app.querySelector<HTMLElement>('.hud-featured')!;
    const list = document.createElement('ul');
    const by = FEATURED.kind === 'attraction' ? 'North Pole' : `@${featured.id}`;
    list.append(entry(FEATURED.kind, featured, by, 'Featured: '));
    box.append(list);
    box.hidden = false;
  }
  for (const square of attractionRegistry.all())
    app.querySelector('.hud-attractions')!.append(entry('attraction', square, 'North Pole'));
  for (const square of boothRegistry.all())
    app.querySelector('.hud-stalls')!.append(entry('booth', square, `@${square.id}`));

  app.querySelector('.hud-claim')!.addEventListener('click', () => {
    map.walkToOpenPlot();
    canvas.focus();
  });
  overview.addEventListener('click', () => {
    map.toggleOverview();
    showOverview();
  });
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

/**
 * Stands in for the "keep me posted" form until a maintainer sets
 * KEEP_POSTED_URL. It collects nothing: it only says the list opens soon.
 */
function renderKeepPosted() {
  document.body.dataset.view = 'booth';
  app.innerHTML = `
    <section class="booth">
      <div class="booth-header">
        <a href="#/">← Back to the map</a>
        <h1>Keep me posted</h1>
        <p class="description">
          The list for news about the next North Pole event opens soon. Nothing is
          collected on this page. In the meantime, watch the repository on GitHub
          for updates.
        </p>
        <p class="booth-help">
          <a href="${REPO_URL}" target="_blank" rel="noopener">Open the repository</a>
        </p>
      </div>
    </section>`;
}

/** The map running now, the visit card open on it, and how the card came to open. */
let map: MapControls | undefined;
let card: VisitCard | undefined;
/** Whether the card opened from a change of address in this visit, so going back closes it. */
let cardFromHistory = false;
/** A hash change this page made itself, while closing a card, for `route` to let pass. */
let ignoreNextRoute = false;

/** The booth a shared link brought this visitor to, invited to build their own until they close or claim. */
const arrival = parseHash(location.hash);
let invite: string | undefined =
  arrival.view === 'square' && arrival.kind === 'booth'
    ? arrival.id
    : arrival.view === 'map' && arrival.focus?.kind === 'booth'
      ? arrival.focus.id
      : undefined;

/** Closes the visit card. `address` says to take the address back off the square, too. */
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
    history.replaceState(null, '', '#/');
  }
}

/** Opens a square's visit card inside the world, or says, on the map, that it isn't there. */
function visit(kind: SquareKind, id: string, fromHistory: boolean) {
  const square = (kind === 'attraction' ? attractionRegistry : boothRegistry).get(id);
  closeCard(false);
  if (!square || !map?.visit(kind, id)) {
    renderUnknown(app.querySelector('.map-note')!, { kind, id });
    return;
  }
  app.querySelector<HTMLElement>('.map-note')!.hidden = true;
  cardFromHistory = fromHistory;
  card = openVisitCard(app.querySelector('.map-frame')!, {
    kind,
    square,
    invite: kind === 'booth' && invite === id,
    onClose: () => closeCard(true),
    onClaim: () => {
      closeCard(true);
      map?.claimNextDoor();
      app.querySelector<HTMLElement>('.map-canvas')?.focus({ preventScroll: true });
    },
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
    return renderKeepPosted();
  }

  const route = parseHash(location.hash);
  // Booths used to be called plots: keep links shared before the rename working.
  if (route.view === 'legacy') return location.replace(`#/booth/${route.id}`);

  // A square opens its visit card in the world, starting the world if it isn't running.
  if (route.view === 'square') {
    if (!map) renderMap();
    return visit(route.kind, route.id, fromHistory);
  }

  // Back from a visit, or See it on the map: the card closes, and the world stays.
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
