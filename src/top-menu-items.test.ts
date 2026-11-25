import { describe, expect, it } from 'vitest';
import { BOOTH_REQUEST_URL, FEEDBACK_URL } from './northpole/links';
import { MENU_ITEMS, currentPlace, menuMarkup } from './top-menu-items';

describe('the top bar menu', () => {
  it('lists the places in order, each with a short label', () => {
    expect(MENU_ITEMS.map((item) => item.label)).toEqual([
      'Map',
      'Booths',
      'Get a booth',
      'Feedback',
      'About',
    ]);
  });

  it('goes to each place by its own address, the forms in a new tab', () => {
    const where = Object.fromEntries(MENU_ITEMS.map((item) => [item.id, item.href]));
    expect(where).toEqual({
      map: '#/',
      booths: undefined,
      'get-a-booth': BOOTH_REQUEST_URL,
      feedback: FEEDBACK_URL,
      about: undefined,
    });
    const external = MENU_ITEMS.filter((item) => item.newTab).map((item) => item.id);
    expect(external).toEqual(['get-a-booth', 'feedback']);
  });

  it('marks the map while the address is the map, and nothing elsewhere', () => {
    expect(currentPlace('')).toBe('map');
    expect(currentPlace('#/')).toBe('map');
    expect(currentPlace('#/?booth=ana')).toBe('map');
    expect(currentPlace('#/factory')).toBeUndefined();
    expect(currentPlace('#/level/the-academy')).toBeUndefined();
    expect(currentPlace('#/booth/ana')).toBeUndefined();
    expect(currentPlace('#/keep-posted')).toBeUndefined();
  });

  it('writes links for places, buttons for actions, and every icon hidden from screen readers', () => {
    const html = menuMarkup();
    expect(html).toContain('class="top-menu-toggle"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('<a class="top-menu-item" data-place="map" href="#/"');
    expect(html).toContain(
      `data-place="feedback" href="${FEEDBACK_URL}" target="_blank" rel="noopener"`,
    );
    expect(html).toContain('<button class="top-menu-item" data-place="booths" type="button"');
    // About opens the intro, as "What is this?" did (src/intro.ts listens to .intro-open).
    expect(html).toContain('<button class="top-menu-item intro-open" data-place="about"');
    const icons = html.match(/<svg [^>]*>/g) ?? [];
    expect(icons).toHaveLength(MENU_ITEMS.length + 1);
    for (const icon of icons) expect(icon).toContain('aria-hidden="true"');
  });
});
