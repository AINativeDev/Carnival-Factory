/**
 * The top bar's menu (docs/specs/top-bar.md): the places a visitor goes, each
 * with a line icon and a short label, and which of them the address is on.
 * Plain data and functions, so the tests can check every item without a page.
 */
import { CLAIM_URL } from './northpole/links';
import { parseHash } from './route';

/** What an item does: go to an address on this page, open another site, or act on the page. */
type MenuTarget =
  { kind: 'route'; href: string } | { kind: 'external'; href: string } | { kind: 'action' };

export type MenuItemId =
  'map' | 'booths' | 'factory' | 'advent' | 'choice' | 'your-booth' | 'about';

export interface MenuItem {
  id: MenuItemId;
  /** The short word or two shown beside the icon on a wide screen. */
  label: string;
  /** The item's accessible name and tooltip, which says where it goes. */
  title: string;
  target: MenuTarget;
}

/**
 * Each item's Lucide-style line icon, the inner shapes of a 24 by 24 drawing in
 * the item's own colour: no emoji, so every screen draws them the same.
 */
export const ICONS = {
  map: '<path d="M14.1 5.55a2 2 0 0 0 1.8 0l3.65-1.83A1 1 0 0 1 21 4.62v12.76a1 1 0 0 1-.55.9l-4.55 2.27a2 2 0 0 1-1.8 0l-4.2-2.1a2 2 0 0 0-1.8 0l-3.65 1.83A1 1 0 0 1 3 19.38V6.62a1 1 0 0 1 .55-.9L8.1 3.45a2 2 0 0 1 1.8 0z"/><path d="M15 5.76v15"/><path d="M9 3.24v15"/>',
  booths:
    '<path d="M3 9 4.5 4h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M9 20v-6h6v6"/>',
  factory: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  advent:
    '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  choice:
    '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/>',
  'your-booth':
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/>',
  about: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
} satisfies Record<MenuItemId, string>;

/** The phone's one menu button: three lines. */
export const MENU_ICON = '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>';

/** The menu, in the order the bar shows it. */
export const MENU_ITEMS: readonly MenuItem[] = [
  { id: 'map', label: 'Map', title: 'The map', target: { kind: 'route', href: '#/' } },
  { id: 'booths', label: 'Booths', title: 'Find a booth', target: { kind: 'action' } },
  {
    id: 'factory',
    label: 'Factory stats',
    title: "The factory's numbers",
    target: { kind: 'route', href: '#/factory' },
  },
  {
    id: 'advent',
    label: 'Advent',
    title: 'The advent calendar',
    target: { kind: 'route', href: '#/advent' },
  },
  {
    id: 'choice',
    label: "People's Choice",
    title: "People's Choice votes",
    target: { kind: 'action' },
  },
  {
    id: 'your-booth',
    label: 'Your booth',
    title: 'Ask for your own booth',
    target: { kind: 'external', href: CLAIM_URL },
  },
  { id: 'about', label: 'About', title: 'What is this?', target: { kind: 'action' } },
];

/** An icon as markup: hidden from screen readers, since the item carries its name. */
export const iconSvg = (shapes: string) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${shapes}</svg>`;

/**
 * The item the address is on, to mark with `aria-current="page"`: the map
 * itself, the factory's numbers or the advent calendar. Inside a square, on a
 * level, a season card or the "keep me posted" page, none is.
 */
export function currentItem(hash: string): MenuItemId | undefined {
  if (hash === '#/keep-posted') return undefined;
  const route = parseHash(hash);
  if (route.view === 'map') return 'map';
  if (route.view === 'factory' || route.view === 'advent') return route.view;
  return undefined;
}

/** Whether the North Pole's own map is on screen, with no square or page open over it. */
export const onTheMap = (hash: string) => currentItem(hash) === 'map';
