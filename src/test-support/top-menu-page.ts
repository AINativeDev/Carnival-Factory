/**
 * A page like the real one for the top bar's menu tests (src/top-menu*.test.ts):
 * the banner's menu, the map's Booths panel and People's Choice list, and the
 * menu started on it, stopped again after each test.
 */
import { startTopMenu, type TopMenu } from '../top-menu';

let running: TopMenu | undefined;

/** The one element a selector must find, or a failed test saying which. */
export function the(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

/** The menu's item for `id`. */
export const item = (id: string) => the(`.top-menu-item[data-item="${id}"]`);

/** Starts the menu on `hash`, on a page with the bar, the Booths panel and, if `choice`, the standings. */
export function page(hash = '#/', choice = true): TopMenu {
  history.replaceState(null, '', hash);
  document.body.innerHTML = `
    <header class="banner"><a class="brand" href="#/">North Pole Carnival</a><nav class="top-menu"></nav></header>
    <main id="app">
      <details class="hud-booths"><summary>Booths</summary><input class="hud-search-input" /></details>
      <details class="choice"><summary>People's Choice</summary></details>
    </main>`;
  return keep(startTopMenu(hash, { choice }));
}

/** Keeps a menu a test started itself, so it's stopped after the test. */
export function keep(menu: TopMenu): TopMenu {
  running = menu;
  return menu;
}

/** Stops the running menu, if any. */
export function stopMenu() {
  running?.stop();
  running = undefined;
}

/** Presses `name` on `target`, and gives back the event to see what was done with it. */
export const key = (target: Element, name: string) => {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
};

/** Changes the address as a link would, and tells the page as the browser would. */
export const go = (hash: string) => {
  history.replaceState(null, '', hash);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};
