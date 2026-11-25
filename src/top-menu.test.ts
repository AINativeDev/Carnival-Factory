// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { the as find } from './dom';
import { startTopMenu } from './top-menu';

const the = (selector: string) => find(document, selector, HTMLElement);
const panel = () => find(document, '.hud-booths', HTMLDetailsElement);

const key = (target: Element, name: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

let stop: (() => void) | undefined;

/** A page like the real one: the banner, and the map with its Booths panel. */
function page(hash = '#/', withPanel = true) {
  history.replaceState(null, '', hash);
  document.body.innerHTML = `
    <header class="banner"><a class="brand" href="#/">Carnival Factory</a><a class="repo-link" href="#">GitHub</a></header>
    <main id="app">${
      withPanel
        ? '<details class="hud-booths"><summary>Booths</summary><input class="hud-search-input" /></details>'
        : ''
    }</main>`;
  stop = startTopMenu(the('.banner'));
}

const toggle = () => find(document, '.top-menu-toggle', HTMLButtonElement);
const item = (place: string) => the(`[data-place="${place}"]`);

beforeEach(() => {
  stop = undefined;
});

afterEach(() => {
  stop?.();
});

describe('the top bar menu', () => {
  it('goes between the brand and the GitHub link', () => {
    page();
    const order = [...the('.banner').children].map((child) => child.className);
    expect(order).toEqual(['brand', 'top-menu', 'repo-link']);
    expect(the('.top-menu').getAttribute('aria-label')).toBe('Places');
  });

  it('marks the current place, and moves the mark with the address', () => {
    page('#/');
    expect(item('map').getAttribute('aria-current')).toBe('page');
    history.replaceState(null, '', '#/factory');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(item('map').hasAttribute('aria-current')).toBe(false);
  });

  it('opens the list from Menu, and Escape closes it and gives focus back', () => {
    page();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    toggle().click();
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(the('.top-menu').hasAttribute('data-open')).toBe(true);
    expect(document.activeElement).toBe(item('map'));
    key(item('map'), 'Escape');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle());
  });

  it('closes the list on a second press of Menu, and a click outside it', () => {
    page();
    toggle().click();
    toggle().click();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    toggle().click();
    the('#app').click();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    the('#app').click();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('ignores Escape and other keys while the list is shut', () => {
    page();
    the('.brand').focus();
    key(the('.brand'), 'Escape');
    expect(document.activeElement).toBe(the('.brand'));
    toggle().click();
    key(item('map'), 'Tab');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
  });

  it('closes the list when a place is picked, with focus on Menu', () => {
    page();
    toggle().click();
    item('about').click();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle());
  });

  it('opens the Booths panel on the map, its search focused', () => {
    page('#/');
    item('booths').click();
    expect(panel().open).toBe(true);
    expect(document.activeElement).toBe(the('.hud-search-input'));
  });

  it('goes back to the map first from anywhere else, then opens the Booths panel', () => {
    page('#/booth/ana');
    item('booths').click();
    expect(location.hash).toBe('#/');
    expect(panel().open).toBe(false);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(panel().open).toBe(true);
  });

  it('does nothing for Booths when the map has no panel', () => {
    page('#/', false);
    item('booths').click();
    expect(document.querySelector('.hud-booths')).toBeNull();
  });

  it('takes itself out, and stops listening, when stopped', () => {
    page('#/');
    stop?.();
    stop = undefined;
    expect(document.querySelector('.top-menu')).toBeNull();
  });
});
