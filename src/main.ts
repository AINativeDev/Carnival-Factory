import './style.css';
import { attractionRegistry } from '../northpole/attractions';
import { CHANGE_URL, CLAIM_URL } from '../northpole/links';
import { PHONE_WIDTH } from '../northpole/camera';
import { startMap, startPreview, type MapControls, type SquareKind } from '../northpole/map';
import type { SandboxedSquare } from '../northpole/sandbox';
import type { NorthPoleSquare } from '../northpole/square';
import { applyTheme } from '../northpole/theme';
import { boothRegistry } from '../northpole/booths';
import { deepLink, parseHash } from './route';

applyTheme();

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

function renderMap(focus?: { kind: SquareKind; id: string }) {
  document.body.dataset.view = 'map';
  app.innerHTML = `
    <section class="map">
      <p class="map-help">
        Welcome to the North Pole. Walk around with WASD or the arrow keys, or click or tap
        where you'd like to go. The attractions round the town square are part of the North
        Pole itself, and the stalls along the lanes each belong to one person: walk up to one
        and press E, or click it, to see it up close. The plots marked "For claim" are waiting
        for a booth: <a href="${CLAIM_URL}" target="_blank" rel="noopener">claim your own</a>.
      </p>
      <p class="map-note" role="status" hidden></p>
      <div class="map-frame">
        <canvas class="map-canvas" tabindex="0" aria-label="The North Pole. Walk with WASD or the arrow keys, or click where you'd like to go. Press E at a booth or an attraction to visit it, or at an open plot to claim it."></canvas>
        <button class="map-prompt" type="button" hidden></button>
        <p class="hud hud-tessl">Built with Tessl</p>
        <details class="hud hud-booths">
          <summary aria-label="Booths"><span class="hud-icon" aria-hidden="true">🎪</span><span class="hud-title">Booths</span></summary>
          <p class="hud-hint">Click one to walk there.</p>
          <ul class="hud-list"></ul>
        </details>
        <details class="hud hud-controls">
          <summary aria-label="Controls"><span class="hud-icon" aria-hidden="true">⌨️</span><span class="hud-title">Controls</span></summary>
          <ul>
            <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> to walk</li>
            <li>Click where you want to go</li>
            <li><kbd>E</kbd> to visit a booth or an attraction</li>
            <li><kbd>E</kbd> at a "For claim" sign to claim that plot</li>
          </ul>
        </details>
        <button class="hud hud-overview" type="button">Show the whole island</button>
      </div>
      <nav class="map-guide" aria-label="Attractions">
        <h2>Attractions</h2>
        <ul class="attractions"></ul>
      </nav>
      <nav class="map-guide" aria-label="Booths">
        <h2>Booths</h2>
        <ul class="booths"></ul>
      </nav>
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
  const map = startMap(
    app.querySelector('.map-frame')!,
    canvas,
    app.querySelector('.map-prompt')!,
    {
      attractions: attractionRegistry.all(),
      booths: boothRegistry.all(),
      onOpen: (kind, id) => (location.hash = `#/${kind}/${id}`),
      focus,
    },
  );
  stop = map.stop;
  renderHud(map, canvas);
}

/**
 * The HUD over the map: the Booths panel, whose entries walk the player to a
 * square, and the button that shows the whole island on a phone. The panels
 * start open on a wide screen and folded to their icons on a phone.
 */
function renderHud(map: MapControls, canvas: HTMLCanvasElement) {
  const wide = window.matchMedia(`(min-width: ${PHONE_WIDTH}px)`).matches;
  for (const panel of app.querySelectorAll<HTMLDetailsElement>('.hud-booths, .hud-controls'))
    panel.open = wide;
  const list = app.querySelector('.hud-list')!;
  const entries: [SquareKind, NorthPoleSquare, string][] = [
    ...attractionRegistry
      .all()
      .map((s): [SquareKind, NorthPoleSquare, string] => ['attraction', s, 'North Pole']),
    ...boothRegistry
      .all()
      .map((s): [SquareKind, NorthPoleSquare, string] => ['booth', s, `@${s.id}`]),
  ];
  for (const [kind, square, by] of entries) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.kind = kind;
    button.dataset.id = square.id;
    button.innerHTML = `<span class="name"></span> <span class="owner"></span>`;
    button.querySelector('.owner')!.textContent = by;
    whenNamed(square, () => (button.querySelector('.name')!.textContent = square.name));
    button.addEventListener('click', () => {
      map.walkTo(kind, square.id);
      canvas.focus();
    });
    item.append(button);
    list.append(item);
  }
  const overview = app.querySelector<HTMLButtonElement>('.hud-overview')!;
  overview.addEventListener('click', () => {
    overview.textContent = map.toggleOverview() ? 'Follow me' : 'Show the whole island';
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

const SHARE = `
        <p class="share">
          <a class="share-map">See it on the map</a>
          <button class="share-copy" type="button">Copy link</button>
          <input class="share-url" type="text" readonly hidden aria-label="Link to it on the map" />
        </p>`;

/**
 * Wires up a square page's share links: one to the map showing the square,
 * and a button that copies that link's full URL. Where the clipboard isn't
 * available, it shows the URL selected, to copy by hand.
 */
function renderShare(kind: SquareKind, id: string) {
  const link = deepLink(kind, id);
  const url = new URL(link, location.href).href;
  app.querySelector<HTMLAnchorElement>('.share-map')!.href = link;
  const button = app.querySelector<HTMLButtonElement>('.share-copy')!;
  const field = app.querySelector<HTMLInputElement>('.share-url')!;
  let reset = 0;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      button.textContent = 'Copied!';
      window.clearTimeout(reset);
      reset = window.setTimeout(() => (button.textContent = 'Copy link'), 2000);
    } catch {
      field.value = url;
      field.hidden = false;
      field.focus();
      field.select();
    }
  });
}

function renderBooth(booth: NorthPoleSquare) {
  document.body.dataset.view = 'booth';
  app.innerHTML = `
    <section class="booth">
      <div class="booth-header">
        <a href="#/">← Back to the map</a>
        <h1></h1>
        <p class="owner">Owned by <a target="_blank" rel="noopener"></a></p>
        <p class="description"></p>${SHARE}
      </div>
      <canvas class="booth-canvas"></canvas>
      <p class="booth-help">
        Is this yours? <a href="${CHANGE_URL}" target="_blank" rel="noopener">Ask the factory for a change</a>.
      </p>
    </section>`;
  whenNamed(booth, () => {
    app.querySelector('h1')!.textContent = booth.name;
    app.querySelector('.description')!.textContent = booth.description;
  });
  const owner = app.querySelector<HTMLAnchorElement>('.owner a')!;
  owner.textContent = `@${booth.id}`;
  owner.href = `https://github.com/${booth.id}`;
  renderShare('booth', booth.id);
  stop = startPreview(app.querySelector('canvas')!, booth);
}

function renderAttraction(attraction: NorthPoleSquare) {
  document.body.dataset.view = 'booth';
  app.innerHTML = `
    <section class="booth">
      <div class="booth-header">
        <a href="#/">← Back to the map</a>
        <h1></h1>
        <p class="owner">An attraction of the North Pole</p>
        <p class="description"></p>${SHARE}
      </div>
      <canvas class="booth-canvas"></canvas>
      <p class="booth-help">
        Attractions belong to the North Pole, so only its maintainers change them.
        <a href="${CLAIM_URL}" target="_blank" rel="noopener">Claim a booth of your own</a> beside it.
      </p>
    </section>`;
  whenNamed(attraction, () => {
    app.querySelector('h1')!.textContent = attraction.name;
    app.querySelector('.description')!.textContent = attraction.description;
  });
  renderShare('attraction', attraction.id);
  stop = startPreview(app.querySelector('canvas')!, attraction);
}

function renderMissing(title: string, description: string) {
  document.body.dataset.view = 'booth';
  app.innerHTML = `
    <section class="booth">
      <div class="booth-header">
        <a href="#/">← Back to the map</a>
        <h1></h1>
        <p class="description"></p>
      </div>
    </section>`;
  app.querySelector('h1')!.textContent = title;
  app.querySelector('.description')!.textContent = description;
}

function route() {
  stop?.();
  stop = undefined;

  const route = parseHash(location.hash);
  // Booths used to be called plots: keep links shared before the rename working.
  if (route.view === 'legacy') return location.replace(`#/booth/${route.id}`);
  if (route.view === 'map') return renderMap(route.focus);
  const { kind, id } = route;

  if (kind === 'attraction') {
    const attraction = attractionRegistry.get(id);
    if (attraction) renderAttraction(attraction);
    else renderMissing('No such attraction', `The North Pole has no attraction called "${id}".`);
    return;
  }

  const booth = boothRegistry.get(id);
  if (booth) renderBooth(booth);
  else
    renderMissing(
      'No booth yet',
      `Nobody has built a booth for @${id} yet. Claim it with a new issue, and the factory builds it.`,
    );
}

window.addEventListener('hashchange', route);
route();
