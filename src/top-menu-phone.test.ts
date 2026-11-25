// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { item, key, page, stopMenu, the } from './test-support/top-menu-page';

/** The phone's Menu button and its list (docs/specs/top-bar.md). */
beforeEach(() => {
  localStorage.setItem('north-pole-intro-seen', '1');
});

afterEach(() => {
  stopMenu();
  localStorage.clear();
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

  it('folds with Escape when focus has left the menu for the rest of the bar', () => {
    const running = page();
    the('.top-menu-toggle').click();
    the('.brand').focus();
    key(the('.brand'), 'Escape');
    expect(running.isOpen).toBe(false);
    expect(document.activeElement).toBe(the('.top-menu-toggle'));
  });

  it('gives focus back to the Menu button when About, chosen from the list, closes', () => {
    page();
    the('.top-menu-toggle').click();
    item('about').focus();
    item('about').click();
    expect(document.querySelector('.intro-backdrop')).not.toBeNull();
    the('.intro-skip').click();
    expect(document.activeElement).toBe(the('.top-menu-toggle'));
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
