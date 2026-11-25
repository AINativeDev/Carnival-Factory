// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { showLevelLinks } from './level-links';

/** A panel's description, in a fresh page, for the links to follow. */
function description() {
  document.body.innerHTML = '<section><p class="visit-description"></p></section>';
  const found = document.querySelector('.visit-description');
  if (!found) throw new Error('no description');
  return found;
}

describe('showLevelLinks', () => {
  it("puts a North Pole level's links after the description, as buttons that open a new tab", () => {
    showLevelLinks(description(), 'the-studio');
    const links = [...document.querySelectorAll<HTMLAnchorElement>('.level-links a.level-link')];
    expect(links.map((link) => [link.textContent, link.href])).toEqual([
      ['Listen to the podcast', 'https://tessl.io/podcast/'],
      ['Watch on YouTube', 'https://www.youtube.com/@tessl-ai'],
    ]);
    for (const link of links) {
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener');
    }
    expect(document.querySelector('.visit-description')?.nextElementSibling?.className).toBe(
      'level-links',
    );
  });

  it("adds nothing for a participant's level, or for no level at all", () => {
    showLevelLinks(description(), 'jedi4ever');
    showLevelLinks(document.body, undefined);
    expect(document.querySelectorAll('.level-links')).toHaveLength(0);
  });
});
