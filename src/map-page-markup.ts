/**
 * The map pages' markup: the North Pole's map with its HUD, People's Choice
 * and a guide to every square for screen readers, and a level's map with its
 * way home. Kept apart from the pages' wiring (src/map-page.ts,
 * src/level-page.ts). Every square's name and owner goes in later, as text.
 */
import { BOOTHS_PANEL } from './booths-hud-markup';
import { CLAIM_URL } from './northpole/links';
import type { SandboxedSquare } from './northpole/sandbox';
import type { NorthPoleSquare } from './northpole/square';
import { CHOICE_PANEL } from './peoples-choice-hud';
import { the } from './dom';

/** The North Pole's map. */
export const NORTH_POLE_MAP = `
    <section class="map">
      <div class="map-frame">
        <canvas class="map-canvas" tabindex="0" aria-label="The North Pole. Walk with WASD or the arrow keys, or click where you'd like to go. Press E at a booth or an attraction to go inside, or at a free spot to build your booth there. Inside, Esc or walking out through the doorway leaves."></canvas>
        <p class="map-note" role="status" hidden></p>
        <button class="map-prompt" type="button" hidden></button>
        <a class="hud hud-tessl" href="#/factory">Built with Tessl</a>
        <button class="hud hud-back" type="button"><span aria-hidden="true">←</span> Back to the map</button>
        ${BOOTHS_PANEL}
        <details class="hud hud-controls">
          <summary>Controls</summary>
          <p>Walk with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys, <kbd>E</kbd> to go inside or build</p>
        </details>
        <div class="hud-actions">
          <button class="hud hud-claim" type="button">Get a booth</button>
          <button class="hud hud-overview" type="button">Show the whole island</button>
        </div>
      </div>
      ${CHOICE_PANEL}
      <div class="visually-hidden">
        <p>
          Welcome to the North Pole. The attractions round the town square are part of the North
          Pole itself, and the stalls along the lanes each belong to one person. The spots marked
          "Free spot" are waiting for a booth:
          <a href="${CLAIM_URL}" target="_blank" rel="noopener">get a booth</a>.
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

/** A level's map, with the way back to the North Pole. */
export const LEVEL_MAP = `
    <section class="map">
      <div class="map-frame">
        <canvas class="map-canvas" tabindex="0"></canvas>
        <p class="map-note" role="status" hidden></p>
        <button class="map-prompt" type="button" hidden></button>
        <button class="hud hud-back" type="button"><span aria-hidden="true">←</span> Back to the map</button>
        <a class="hud hud-home" href="#/"><span aria-hidden="true">←</span> Back to the North Pole</a>
        <details class="hud hud-controls" open>
          <summary>Controls</summary>
          <p>Walk with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys, <kbd>E</kbd> to visit a square or ride the sleigh home</p>
        </details>
      </div>
    </section>`;

/**
 * Calls `show` now, and again once a sandboxed square's frame has said its name
 * and description: until then the page only knows its id. The later call only
 * happens while the page that asked is still the one showing, so a square that
 * opens after you've moved on never writes over another page.
 */
export function whenNamed(app: HTMLElement, square: NorthPoleSquare, show: () => void) {
  show();
  const view = app.firstElementChild;
  if ('onReady' in square) {
    (square as SandboxedSquare).onReady(() => {
      if (view?.isConnected) show();
    });
  }
}

/** The guide's list of squares, each a link inside it, by name and owner. */
export function renderGuide(
  app: HTMLElement,
  list: Element,
  squares: NorthPoleSquare[],
  guide: { href: string; by: (id: string) => string },
) {
  for (const square of squares) {
    const item = document.createElement('li');
    item.innerHTML = `<a><span class="name"></span> <span class="owner"></span></a>`;
    the(item, 'a', HTMLAnchorElement).href = `#/${guide.href}/${square.id}`;
    whenNamed(app, square, () => {
      the(item, '.name', HTMLElement).textContent = square.name;
    });
    the(item, '.owner', HTMLElement).textContent = guide.by(square.id);
    list.append(item);
  }
}
