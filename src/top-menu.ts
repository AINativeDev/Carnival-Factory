/**
 * The top bar's menu (docs/specs/top-bar.md): every place a visitor goes, in
 * one row on a wide screen and behind one menu button on a phone, so the bar
 * never scrolls sideways. About opens the first-visit intro, which this starts
 * too, once its button is in the bar.
 */
import { startIntro } from './intro';
import { PEOPLES_CHOICE } from './northpole/peoples-choice-standings';
import {
  currentItem,
  iconSvg,
  ICONS,
  MENU_ICON,
  MENU_ITEMS,
  onTheMap,
  type MenuItem,
  type MenuItemId,
} from './top-menu-items';

export interface TopMenuOptions {
  /** Whether the build has People's Choice standings: without them there's no list to open. */
  choice?: boolean;
}

/** The running menu: whether the phone's list is open, and how to stop it. */
export interface TopMenu {
  readonly isOpen: boolean;
  stop(): void;
}

/** One item's link or button. Its text is the menu's own, never a participant's. */
function itemElement(item: MenuItem): HTMLElement {
  const element = document.createElement(item.target.kind === 'action' ? 'button' : 'a');
  if (element instanceof HTMLButtonElement) element.type = 'button';
  if (item.target.kind !== 'action') element.setAttribute('href', item.target.href);
  if (item.target.kind === 'external') {
    element.setAttribute('target', '_blank');
    element.setAttribute('rel', 'noopener');
  }
  element.className = 'top-menu-item';
  // The intro wires the bar's "What is this?" by this class (src/intro.ts).
  if (item.id === 'about') element.classList.add('intro-open');
  element.dataset.item = item.id;
  element.setAttribute('aria-label', item.label);
  element.title = item.title;
  const label = document.createElement('span');
  label.className = 'top-menu-label';
  label.textContent = item.label;
  element.innerHTML = iconSvg(ICONS[item.id]);
  element.append(label);
  return element;
}

/**
 * Builds the menu in the banner's `.top-menu`, marks the item the address is
 * on, and starts the intro (src/intro.ts) for `hash`, the address the page
 * opened at.
 */
export function startTopMenu(hash: string, options: TopMenuOptions = {}): TopMenu {
  const choice = options.choice ?? PEOPLES_CHOICE !== undefined;
  // A page without the banner still gets the intro: the menu is built, just never shown.
  const nav = document.querySelector<HTMLElement>('.top-menu') ?? document.createElement('nav');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'top-menu-toggle';
  toggle.setAttribute('aria-label', 'Menu');
  toggle.title = 'Menu';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'top-menu-list');
  toggle.innerHTML = iconSvg(MENU_ICON);
  const list = document.createElement('ul');
  list.id = 'top-menu-list';
  list.className = 'top-menu-list';
  for (const item of MENU_ITEMS) {
    if (item.id === 'choice' && !choice) continue;
    const entry = document.createElement('li');
    entry.append(itemElement(item));
    list.append(entry);
  }
  nav.replaceChildren(toggle, list);

  const setOpen = (open: boolean) => {
    if (open) nav.dataset.open = '';
    else delete nav.dataset.open;
    toggle.setAttribute('aria-expanded', String(open));
  };
  const isOpen = () => nav.dataset.open !== undefined;

  // The address the marks were last set for: a page closed over the map takes
  // its address off with history.replaceState (src/main.ts), which no event tells.
  let marked: string | undefined;
  const markCurrent = () => {
    if (location.hash === marked) return;
    marked = location.hash;
    const current = currentItem(location.hash);
    for (const item of list.querySelectorAll<HTMLElement>('.top-menu-item')) {
      if (item.dataset.item === current) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    }
  };

  // The one panel waiting for the map to come back: a later choice replaces it,
  // so stopping the menu always cancels whatever still waits.
  let pending: (() => void) | undefined;
  const cancelPending = () => {
    if (pending) window.removeEventListener('hashchange', pending);
    pending = undefined;
  };
  /** Runs `show` on the North Pole's map: now when it's on screen, else once the map's route has opened it. */
  const onMap = (show: () => void) => {
    cancelPending();
    if (onTheMap(location.hash)) {
      show();
      return;
    }
    pending = show;
    // Added after the page's own router (src/main.ts), so it runs once the map is back.
    window.addEventListener('hashchange', pending, { once: true });
    location.hash = '#/';
  };

  const actions: Partial<Record<MenuItemId, () => void>> = {
    booths: () => {
      onMap(() => {
        const panel = document.querySelector<HTMLDetailsElement>('.hud-booths');
        if (!panel) return;
        panel.open = true;
        panel.querySelector<HTMLElement>('.hud-search-input')?.focus({ preventScroll: true });
      });
    },
    choice: () => {
      onMap(() => {
        const panel = document.querySelector<HTMLDetailsElement>('.choice');
        if (!panel) return;
        panel.open = true;
        panel.querySelector<HTMLElement>('summary')?.focus();
      });
    },
  };

  const onClick = (event: Event) => {
    // A click inside the menu always lands on one of its elements.
    const target = event.target as Element;
    if (target.closest('.top-menu-toggle')) {
      setOpen(!isOpen());
      return;
    }
    const item = target.closest<HTMLElement>('.top-menu-item');
    if (!item) return;
    // Folding the phone's list hides the item focus is on, so focus goes back to
    // the Menu button first. Heard before the item's own listeners, so About's
    // intro returns focus there when it closes.
    if (isOpen() && list.contains(document.activeElement)) toggle.focus();
    setOpen(false);
    actions[item.dataset.item as MenuItemId]?.();
  };
  /**
   * Esc folds the phone's list and gives focus back to its button, wherever
   * focus has gone, and the map behind never hears it: heard on the document
   * before anything else.
   */
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    event.stopPropagation();
    setOpen(false);
    toggle.focus();
  };
  /** A click anywhere outside the menu folds the phone's list. */
  const onOutside = (event: Event) => {
    if (event.target instanceof Node && nav.contains(event.target)) return;
    setOpen(false);
  };

  nav.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('click', onOutside);
  window.addEventListener('hashchange', markCurrent);
  const pages = new MutationObserver(markCurrent);
  pages.observe(document.body, { childList: true, subtree: true });
  markCurrent();
  const intro = startIntro(hash);

  return {
    get isOpen() {
      return isOpen();
    },
    stop: () => {
      intro.stop();
      nav.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('click', onOutside);
      window.removeEventListener('hashchange', markCurrent);
      cancelPending();
      pages.disconnect();
      nav.replaceChildren();
    },
  };
}
