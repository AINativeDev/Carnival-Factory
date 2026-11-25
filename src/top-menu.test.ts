// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CLAIM_URL } from './northpole/links';
import { go, item, keep, page, stopMenu, the } from './test-support/top-menu-page';
import { startTopMenu } from './top-menu';

beforeEach(() => {
  localStorage.setItem('north-pole-intro-seen', '1');
});

afterEach(() => {
  stopMenu();
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

  it('follows a page closed over the map, which takes its address off without a hashchange', async () => {
    page('#/factory');
    const card = document.createElement('section');
    the('#app').append(card);
    history.replaceState(null, '', '#/');
    card.remove();
    await Promise.resolve();
    expect(item('map').getAttribute('aria-current')).toBe('page');
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
    expect(() => window.dispatchEvent(new HashChangeEvent('hashchange'))).not.toThrow();
    history.replaceState(null, '', '#/advent');
    item('choice').click();
    expect(() => window.dispatchEvent(new HashChangeEvent('hashchange'))).not.toThrow();
  });
});

describe('starting the menu', () => {
  it('reads whether there are standings from the build when not told', () => {
    history.replaceState(null, '', '#/');
    document.body.innerHTML = '<nav class="top-menu"></nav>';
    keep(startTopMenu('#/'));
    expect(document.querySelector('[data-item="choice"]')).toBeNull();
  });

  it('still starts the intro on a page without the bar', () => {
    localStorage.clear();
    history.replaceState(null, '', '#/');
    document.body.innerHTML = '<main id="app"></main>';
    keep(startTopMenu('#/'));
    expect(document.querySelector('.intro-backdrop')).not.toBeNull();
  });

  it('stops listening, and empties the bar, when stopped', () => {
    page();
    stopMenu();
    expect(document.querySelector('.top-menu')?.children).toHaveLength(0);
    go('#/factory');
    document.body.click();
  });

  it('never opens a panel that was waiting for the map once stopped', () => {
    page('#/booth/jedi4ever');
    item('booths').click();
    stopMenu();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(the('.hud-booths').hasAttribute('open')).toBe(false);
  });

  it('never opens any panel that was waiting for the map once stopped, however many were chosen', () => {
    page('#/booth/jedi4ever');
    item('booths').click();
    // Off the map again before the first choice heard the map come back.
    history.replaceState(null, '', '#/advent');
    item('choice').click();
    stopMenu();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(the('.hud-booths').hasAttribute('open')).toBe(false);
    expect(the('.choice').hasAttribute('open')).toBe(false);
  });

  it('says which selector found nothing', () => {
    page();
    expect(() => the('.nowhere')).toThrow('Nothing matches .nowhere');
  });
});
