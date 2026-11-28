/**
 * The buttons out of the map on a North Pole level's panels: its own panel,
 * its landmark's room and its squares' panels. The links are the maintainers'
 * fixed list (`northpole/north-pole-links.ts`); each is built with DOM calls,
 * never as HTML, and opens in a new tab (ADR 0038).
 */
import { northPoleLinks } from './northpole/north-pole-links';

/** Puts the links of `home`, if it's a North Pole level with any, right after `description`. */
export function showLevelLinks(description: Element, home: string | undefined) {
  // A link only the place's game opens, such as the Academy's pretend booths, stays off the panel.
  const links = (home ? northPoleLinks(home) : []).filter((link) => link.panel !== false);
  if (!links.length) return;
  const row = document.createElement('p');
  row.className = 'level-links';
  for (const { label, href } of links) {
    const link = document.createElement('a');
    link.className = 'level-link';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = label;
    row.append(link);
  }
  description.after(row);
}
