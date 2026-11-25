import { describe, expect, it } from 'vitest';
import { CLAIM_URL } from './northpole/links';
import { currentItem, MENU_ITEMS, onTheMap } from './top-menu-items';

describe('the menu items', () => {
  it('lists the places a visitor goes, in order', () => {
    expect(MENU_ITEMS.map((one) => one.label)).toEqual([
      'Map',
      'Booths',
      'Factory stats',
      'Advent',
      "People's Choice",
      'Your booth',
      'About',
    ]);
  });

  it('sends each route to its address and Your booth to the booth form', () => {
    const targets = Object.fromEntries(MENU_ITEMS.map((one) => [one.id, one.target]));
    expect(targets.map).toEqual({ kind: 'route', href: '#/' });
    expect(targets.factory).toEqual({ kind: 'route', href: '#/factory' });
    expect(targets.advent).toEqual({ kind: 'route', href: '#/advent' });
    expect(targets['your-booth']).toEqual({ kind: 'external', href: CLAIM_URL });
  });
});

describe('the current item', () => {
  it.each([
    ['', 'map'],
    ['#/', 'map'],
    ['#/?booth=jedi4ever', 'map'],
    ['#/factory', 'factory'],
    ['#/advent', 'advent'],
    ['#/booth/jedi4ever', undefined],
    ['#/level/jedi4ever', undefined],
    ['#/season/jedi4ever', undefined],
    ['#/keep-posted', undefined],
  ])('for %j is %s', (hash, expected) => {
    expect(currentItem(hash)).toBe(expected);
    expect(onTheMap(hash)).toBe(expected === 'map');
  });
});
