// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INTRO_EVENT } from './analytics-events';
import { BOOTH_REQUEST_URL } from './northpole/links';
import { INTRO_SEEN_KEY, showsOnArrival, startIntro, type Intro } from './intro';

/** The one element a selector must find, or a failed test saying which. */
function the(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

/** What the intro told analytics, in order. */
let told: unknown[] = [];
const listen = (event: Event) => told.push((event as CustomEvent).detail);
let intro: Intro | undefined;

/** A page like the real one: the banner's "What is this?" and the map's canvas, focused. */
function page(hash = '#/') {
  document.body.innerHTML = `
    <header class="banner"><button class="intro-open" type="button">What is this?</button></header>
    <main id="app"><canvas class="map-canvas" tabindex="0"></canvas></main>`;
  the('.map-canvas').focus();
  intro = startIntro(hash);
  return intro;
}

const key = (target: Element, name: string, shiftKey = false) => {
  const event = new KeyboardEvent('keydown', {
    key: name,
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
};

beforeEach(() => {
  localStorage.clear();
  told = [];
  window.addEventListener(INTRO_EVENT, listen);
});

afterEach(() => {
  intro?.stop();
  window.removeEventListener(INTRO_EVENT, listen);
  vi.unstubAllGlobals();
});

describe('when the intro shows', () => {
  it('shows on a first visit to the map itself, and not once it has been seen', () => {
    for (const hash of ['', '#', '#/']) expect(showsOnArrival(hash, false)).toBe(true);
    expect(showsOnArrival('#/', true)).toBe(false);
  });

  it('never shows on a shared or deep link', () => {
    for (const hash of [
      '#/booth/ana',
      '#/attraction/ferris-wheel',
      '#/?booth=ana',
      '#/?attraction=ferris-wheel',
      '#/level/ana',
      '#/level/ana/hut',
      '#/factory',
      '#/advent',
      '#/season/ana',
      '#/keep-posted',
      '#/plot/ana',
    ])
      expect(showsOnArrival(hash, false)).toBe(false);
  });

  it('opens on a first visit, and stays closed on the next once closed', () => {
    expect(page().isOpen).toBe(true);
    expect(told).toEqual(['opened']);
    the('.intro-skip').click();
    expect(localStorage.getItem(INTRO_SEEN_KEY)).toBe('1');
    intro?.stop();
    expect(page().isOpen).toBe(false);
  });

  it('stays closed on a deep link, even on a first visit', () => {
    expect(page('#/booth/ana').isOpen).toBe(false);
    expect(document.querySelector('.intro')).toBeNull();
  });

  it('shows every time when the page has no storage', () => {
    const off = () => {
      throw new Error('storage is off');
    };
    vi.stubGlobal('localStorage', { getItem: off, setItem: off });
    expect(page().isOpen).toBe(true);
    the('.intro-skip').click();
    intro?.stop();
    expect(page().isOpen).toBe(true);
  });
});

describe('the intro as a dialog', () => {
  it('is a modal dialog labelled by its title, with the three beats and both ways on', () => {
    page();
    const dialog = the('.intro');
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = document.getElementById(dialog.getAttribute('aria-labelledby') ?? '');
    expect(title?.textContent).toBe('Welcome to Carnival Factory – Christmas edition');
    expect(document.querySelectorAll('.intro-beat')).toHaveLength(3);
    expect(document.querySelectorAll('.intro-beat canvas')).toHaveLength(3);
    const build = the('.intro-build') as HTMLAnchorElement;
    expect(build.href).toBe(BOOTH_REQUEST_URL);
    expect(build.target).toBe('_blank');
    expect(document.activeElement).toBe(the('.intro-explore'));
  });

  it('closes with Skip, Esc, a click outside, Explore and Build, saying how', () => {
    // Esc is a key on the dialog; every other way is a click.
    const ways: [string, string][] = [
      ['skip', '.intro-skip'],
      ['skip', 'Escape'],
      ['skip', '.intro-backdrop'],
      ['explore', '.intro-explore'],
      ['build', '.intro-build'],
    ];
    for (const [how, way] of ways) {
      intro?.stop();
      localStorage.clear();
      told = [];
      page();
      if (way === 'Escape') key(the('.intro-explore'), way);
      else the(way).click();
      expect(intro?.isOpen).toBe(false);
      expect(document.querySelector('.intro')).toBeNull();
      expect(told).toEqual(['opened', how]);
      expect(document.activeElement).toBe(the('.map-canvas'));
    }
  });

  it("stays open for a click inside it, and keeps the map's keys from walking", () => {
    page();
    the('.intro-title').click();
    expect(intro?.isOpen).toBe(true);
    const walking = vi.fn();
    window.addEventListener('keydown', walking);
    key(the('.intro-explore'), 'w');
    window.removeEventListener('keydown', walking);
    expect(walking).not.toHaveBeenCalled();
  });

  it('keeps keyboard focus inside while open', () => {
    page();
    const skip = the('.intro-skip');
    const build = the('.intro-build');
    build.focus();
    expect(key(build, 'Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(skip);
    expect(key(skip, 'Tab', true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(build);
    the('.intro-explore').focus();
    expect(key(the('.intro-explore'), 'Tab').defaultPrevented).toBe(false);
  });

  it('reopens from "What is this?", once, and gives focus back to it', () => {
    page().close('skip');
    const reopen = the('.intro-open');
    reopen.focus();
    reopen.click();
    reopen.click();
    expect(document.querySelectorAll('.intro')).toHaveLength(1);
    expect(told).toEqual(['opened', 'skip', 'opened']);
    the('.intro-skip').click();
    expect(document.activeElement).toBe(reopen);
  });

  it('gives focus to the map when what had it has gone', () => {
    page('#/booth/ana');
    the('.intro-open').focus();
    intro?.open();
    the('.intro-open').remove();
    intro?.close('explore');
    expect(document.activeElement).toBe(the('.map-canvas'));
  });

  it('stops listening to "What is this?" when stopped', () => {
    page('#/booth/ana').stop();
    the('.intro-open').click();
    intro?.close('skip');
    expect(document.querySelector('.intro')).toBeNull();
    expect(told).toEqual([]);
  });
});
