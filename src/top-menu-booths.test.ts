// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { the as find } from './dom';
import { startTopMenu } from './top-menu';

let stop: (() => void) | undefined;
afterEach(() => {
  stop?.();
  stop = undefined;
});

/** The banner and the map's Booths panel, with or without its search box. */
function page(hash: string, search = true) {
  history.replaceState(null, '', hash);
  document.body.innerHTML = `
    <header class="banner"><a class="repo-link" href="#">GitHub</a></header>
    <main><details class="hud-booths"><summary>Booths</summary>${
      search ? '<input class="hud-search-input" />' : ''
    }</details></main>`;
  stop = startTopMenu(find(document, '.banner', HTMLElement));
}

const panel = () => find(document, '.hud-booths', HTMLDetailsElement);
const toggle = () => find(document, '.top-menu-toggle', HTMLButtonElement);
const item = (place: string) => find(document, `[data-place="${place}"]`, HTMLElement);

describe('Booths in the top menu', () => {
  it('opens the panel once on the way back to the map, not on every later change of address', () => {
    page('#/booth/ana');
    item('booths').click();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(panel().open).toBe(true);
    panel().open = false;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(panel().open).toBe(false);
  });

  it('opens a panel that has no search box yet', () => {
    page('#/', false);
    item('booths').click();
    expect(panel().open).toBe(true);
  });
});

describe('the Menu button', () => {
  it('keeps the focus on itself when it shuts the list', () => {
    page('#/');
    toggle().click();
    toggle().focus();
    toggle().click();
    expect(document.activeElement).toBe(toggle());
  });

  it('stops hearing clicks outside once stopped', () => {
    page('#/');
    const menu = toggle();
    menu.click();
    stop?.();
    stop = undefined;
    document.body.click();
    expect(menu.getAttribute('aria-expanded')).toBe('true');
  });
});
