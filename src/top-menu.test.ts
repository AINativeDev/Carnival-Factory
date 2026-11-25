// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CLAIM_URL } from './northpole/links';
import { startTopMenu, type TopMenu } from './top-menu';

/** The one element a selector must find, or a failed test saying which. */
function the(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

const item = (id: string) => the(`.top-menu-item[data-item="${id}"]`);

let menu: TopMenu | undefined;

/** A page like the real one: the banner's menu, the map's Booths panel and People's Choice list. */
function page(hash = '#/', choice = true) {
  history.replaceState(null, '', hash);
  document.body.innerHTML = `
    <header class="banner"><a class="brand" href="#/">North Pole Carnival</a><nav class="top-menu"></nav></header>
    <main id="app">
      <details class="hud-booths"><summary>Booths</summary><input class="hud-search-input" /></details>
      <details class="choice"><summary>People's Choice</summary></details>
    </main>`;
  menu = startTopMenu(hash, { choice });
  return menu;
}

const key = (target: Element, name: string) => {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
};

/** Changes the address as a link would, and tells the page as the browser would. */
const go = (hash: string) => {
  history.replaceState(null, '', hash);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};

beforeEach(() => {
  localStorage.setItem('north-pole-intro-seen', '1');
});

afterEach(() => {
  menu?.stop();
  menu = undefined;
  localStorage.clear();
});

describe('the current item', () => {
  it('is marked with aria-current, and follows the address', () => {
    page('#/factory');
    expect(item('factory').getAttribute('aria-current')).toBe('page');
    expect(item('map').hasAttribute('aria-current')).toBe(false);
    go('#/advent');
    expect(item('advent').getAttribute('aria-current')).toBe('page');
    expect(item('factory').hasAttribute('aria-current')).toBe(false);
  });
});

describe('the menu in the bar', () => {
  it('gives every item a line icon, a name and a tooltip, and links where it goes', () => {
    page();
    const items = [...document.querySelectorAll<HTMLElement>('.top-menu-item')];
    expect(items).toHaveLength(7);
    for (const one of items) {
      expect(one.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(one.getAttribute('aria-label')).toBe(
        one.querySelector('.top-menu-label')?.textContent,
      );
      expect(one.title).not.toBe('');
    }
    expect(item('map').getAttribute('href')).toBe('#/');
    expect(item('your-booth').getAttribute('href')).toBe(CLAIM_URL);
    expect(item('your-booth').getAttribute('target')).toBe('_blank');
    expect(item('booths').tagName).toBe('BUTTON');
  });

  it("leaves People's Choice out when the build has no standings", () => {
    page('#/', false);
    expect(document.querySelector('[data-item="choice"]')).toBeNull();
  });

  it('About opens the intro', () => {
    page();
    item('about').click();
    expect(document.querySelector('.intro-backdrop')).not.toBeNull();
  });

  it('Booths opens the Booths panel on the map and puts focus in its search', () => {
    page();
    item('booths').click();
    expect(the('.hud-booths').hasAttribute('open')).toBe(true);
    expect(document.activeElement).toBe(the('.hud-search-input'));
  });

  it("People's Choice opens the list below the map", () => {
    page();
    item('choice').click();
    expect(the('.choice').hasAttribute('open')).toBe(true);
    expect(document.activeElement).toBe(the('.choice summary'));
  });

  it('from inside a square, goes back to the map first, then opens the panel', () => {
    page('#/booth/jedi4ever');
    item('booths').click();
    expect(location.hash).toBe('#/');
    expect(the('.hud-booths').hasAttribute('open')).toBe(false);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(the('.hud-booths').hasAttribute('open')).toBe(true);
  });

  it('does nothing more when the map it went back to has no panel', () => {
    page('#/booth/jedi4ever');
    the('.hud-booths').remove();
    the('.choice').remove();
    item('booths').click();
    item('choice').click();
    expect(() => window.dispatchEvent(new HashChangeEvent('hashchange'))).not.toThrow();
  });
});

describe("the phone's menu button", () => {
  it('opens and folds the list, and says so', () => {
    const running = page();
    const toggle = the('.top-menu-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    expect(running.isOpen).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.click();
    expect(running.isOpen).toBe(false);
  });

  it('folds with Escape, gives focus back to the button, and keeps the key from the map', () => {
    const running = page();
    let heard = false;
    document.addEventListener('keydown', () => (heard = true), { once: true });
    the('.top-menu-toggle').click();
    const event = key(item('map'), 'Escape');
    expect(running.isOpen).toBe(false);
    expect(document.activeElement).toBe(the('.top-menu-toggle'));
    expect(heard).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });

  it('lets other keys, and Escape while folded, pass', () => {
    page();
    let heard = 0;
    const listen = () => heard++;
    document.addEventListener('keydown', listen);
    key(item('map'), 'Escape');
    the('.top-menu-toggle').click();
    key(item('map'), 'Enter');
    document.removeEventListener('keydown', listen);
    expect(heard).toBe(2);
  });

  it('folds when an item is chosen or the page is clicked outside it', () => {
    const running = page();
    the('.top-menu-toggle').click();
    item('map').click();
    expect(running.isOpen).toBe(false);
    the('.top-menu-toggle').click();
    the('.top-menu-list').click();
    expect(running.isOpen).toBe(true);
    the('#app').click();
    expect(running.isOpen).toBe(false);
  });
});

describe('starting the menu', () => {
  it('reads whether there are standings from the build when not told', () => {
    history.replaceState(null, '', '#/');
    document.body.innerHTML = '<nav class="top-menu"></nav>';
    menu = startTopMenu('#/');
    expect(document.querySelector('[data-item="choice"]')).toBeNull();
  });

  it('still starts the intro on a page without the bar', () => {
    localStorage.clear();
    history.replaceState(null, '', '#/');
    document.body.innerHTML = '<main id="app"></main>';
    menu = startTopMenu('#/');
    expect(document.querySelector('.intro-backdrop')).not.toBeNull();
  });

  it('stops listening, and empties the bar, when stopped', () => {
    const running = page();
    running.stop();
    menu = undefined;
    expect(document.querySelector('.top-menu')?.children).toHaveLength(0);
    go('#/factory');
    document.body.click();
  });
});
