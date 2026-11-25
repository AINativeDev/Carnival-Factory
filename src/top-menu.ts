/**
 * The top bar's menu (docs/specs/top-bar-menu.md): a few places, each an icon
 * and a short label, between the brand and the GitHub link. At phone width
 * the stylesheet folds them behind one Menu button, which opens the list
 * here; Escape or a pick closes it and focus goes back to Menu. Its links
 * are plain hash links, so going somewhere from inside a square leaves it the
 * way every other link does (src/router.ts).
 */
import { currentPlace, menuMarkup } from './top-menu-items';

/** Opens the map's Booths panel (src/booths-hud.ts), its search ready to type in. */
function openBoothsPanel() {
  const panel = document.querySelector<HTMLDetailsElement>('.hud-booths');
  if (!panel) return;
  panel.open = true;
  panel.querySelector<HTMLInputElement>('.hud-search-input')?.focus({ preventScroll: true });
}

/** Builds the menu into the banner, before its GitHub link, and returns how to take it out. */
export function startTopMenu(banner: HTMLElement): () => void {
  const nav = document.createElement('nav');
  nav.className = 'top-menu';
  nav.setAttribute('aria-label', 'Places');
  nav.innerHTML = menuMarkup();
  banner.insertBefore(nav, banner.querySelector('.repo-link'));
  const toggle = nav.querySelector<HTMLButtonElement>('.top-menu-toggle');
  const items = [...nav.querySelectorAll<HTMLElement>('.top-menu-item')];

  const setOpen = (open: boolean) => {
    nav.toggleAttribute('data-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
  };
  const isOpen = () => nav.hasAttribute('data-open');
  const shut = () => {
    if (!isOpen()) return;
    setOpen(false);
    toggle?.focus({ preventScroll: true });
  };

  const markCurrent = () => {
    const place = currentPlace(location.hash);
    for (const item of items) {
      if (item.dataset.place === place) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    }
  };

  const showBooths = () => {
    if (currentPlace(location.hash) === 'map') {
      openBoothsPanel();
      return;
    }
    // The router hears the change first (it listened first), so the map is back when this runs.
    window.addEventListener('hashchange', openBoothsPanel, { once: true });
    location.hash = '#/';
  };

  toggle?.addEventListener('click', () => {
    const open = !isOpen();
    setOpen(open);
    if (open) items[0]?.focus({ preventScroll: true });
  });
  // Registered before src/intro.ts hears About, so the intro gives focus back to Menu, not a hidden item.
  for (const item of items) item.addEventListener('click', shut);
  nav.querySelector('[data-place="booths"]')?.addEventListener('click', showBooths);
  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') shut();
  });
  const onOutside = (event: MouseEvent) => {
    if (isOpen() && !nav.contains(event.target as Node)) setOpen(false);
  };
  document.addEventListener('click', onOutside);
  window.addEventListener('hashchange', markCurrent);
  markCurrent();

  return () => {
    document.removeEventListener('click', onOutside);
    window.removeEventListener('hashchange', markCurrent);
    nav.remove();
  };
}
