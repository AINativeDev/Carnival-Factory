/**
 * The top bar's menu of places (docs/specs/top-bar-menu.md): what each item
 * is called, where it goes and its icon, and which one the address is at.
 * Kept apart from the menu's behaviour (src/top-menu.ts). Every label and
 * address here is the site's own, never a participant's.
 */
import { BOOTH_REQUEST_URL, FEEDBACK_URL } from './northpole/links';
import { parseHash } from './route';

/** One place in the menu: a link when it has an address, else a button the menu wires. */
export interface MenuItem {
  readonly id: 'map' | 'booths' | 'get-a-booth' | 'feedback' | 'about';
  readonly label: string;
  /** Lucide-style line icon: the inside of a 24 by 24 stroked SVG. */
  readonly icon: string;
  readonly href?: string;
  /** The issue forms open in a new tab, so the map stays where the visitor left it. */
  readonly newTab?: boolean;
}

export const MENU_ITEMS: readonly MenuItem[] = [
  {
    id: 'map',
    label: 'Map',
    href: '#/',
    icon: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  },
  {
    id: 'booths',
    label: 'Booths',
    icon: '<path d="M3 9l1.5-5h15L21 9z"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>',
  },
  // The Advent calendar's item goes here once its feature flag is on (src/feature-flags.ts).
  {
    id: 'get-a-booth',
    label: 'Get a booth',
    href: BOOTH_REQUEST_URL,
    newTab: true,
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    href: FEEDBACK_URL,
    newTab: true,
    icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  },
  {
    id: 'about',
    label: 'About',
    icon: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  },
];

const MENU_ICON = '<path d="M4 6h16M4 12h16M4 18h16"/>';

/** The menu item the address is at, for `aria-current`: only the map is a place you stay on. */
export function currentPlace(hash: string): MenuItem['id'] | undefined {
  // The keep-me-posted page reads as the map to the router's parser, but it's a page of its own.
  if (hash === '#/keep-posted') return undefined;
  return parseHash(hash).view === 'map' ? 'map' : undefined;
}

const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

/** One item's markup: its icon, then its label, which a mid-width bar hides from sight only. */
function itemMarkup(item: MenuItem): string {
  const inside = `${svg(item.icon)}<span class="top-menu-label">${item.label}</span>`;
  const title = `title="${item.label}"`;
  if (item.href === undefined) {
    const about = item.id === 'about' ? ' intro-open' : '';
    return `<button class="top-menu-item${about}" data-place="${item.id}" type="button" ${title}>${inside}</button>`;
  }
  const tab = item.newTab ? ' target="_blank" rel="noopener"' : '';
  return `<a class="top-menu-item" data-place="${item.id}" href="${item.href}"${tab} ${title}>${inside}</a>`;
}

/** The menu's markup: the phone's Menu button, and the list it folds. */
export function menuMarkup(): string {
  const items = MENU_ITEMS.map((item) => `<li>${itemMarkup(item)}</li>`).join('');
  return `<button class="top-menu-toggle" type="button" aria-expanded="false" aria-controls="top-menu-list">${svg(MENU_ICON)}<span>Menu</span></button><ul class="top-menu-list" id="top-menu-list">${items}</ul>`;
}
