import { describe, expect, it } from 'vitest';
import { httpsOnly, linksHome, NORTH_POLE_LINKS, northPoleLinks } from './north-pole-links';
import { isNorthPoleLevel } from './north-pole-levels';

const levelFolders = Object.keys(import.meta.glob('../../carnival/levels/*/level.ts')).map(
  (path) => path.split('/').at(-2) ?? '',
);

describe("the North Pole's own links out", () => {
  it('starts the Academy from The Academy', () => {
    expect(northPoleLinks('the-academy')).toEqual([
      { label: 'Start the Academy', href: 'https://tessl.io/academy' },
    ]);
  });

  it('opens the podcast and the YouTube channel from The Recording Studio', () => {
    expect(northPoleLinks('the-studio')).toEqual([
      { label: 'Listen to the podcast', href: 'https://tessl.io/podcast/' },
      { label: 'Watch on YouTube', href: 'https://www.youtube.com/@tessl-ai' },
    ]);
  });

  it("gives links only to the North Pole's own levels, never a participant's", () => {
    for (const id of Object.keys(NORTH_POLE_LINKS)) expect(isNorthPoleLevel(id)).toBe(true);
    const participants = levelFolders.filter((id) => !isNorthPoleLevel(id));
    expect(participants).toContain('jedi4ever');
    for (const id of participants) expect(northPoleLinks(id)).toEqual([]);
    expect(northPoleLinks('constructor')).toEqual([]);
    expect(northPoleLinks('the-factory')).toEqual([]);
  });

  it('keeps only https links', () => {
    expect(
      httpsOnly([
        { label: 'Safe', href: 'https://tessl.io/' },
        { label: 'Plain', href: 'http://tessl.io/' },
        { label: 'Script', href: 'javascript:alert(1)' },
        { label: 'Broken', href: 'not a link' },
      ]),
    ).toEqual([{ label: 'Safe', href: 'https://tessl.io/' }]);
  });
});

describe('linksHome', () => {
  it("finds the North Pole level a panel's links come from", () => {
    expect(linksHome('level', 'the-studio')).toBe('the-studio');
    expect(linksHome('attraction', 'the-academy')).toBe('the-academy');
    expect(linksHome('attraction', 'podcast-booth', 'the-studio')).toBe('the-studio');
    expect(linksHome('attraction', 'ferris-wheel')).toBeUndefined();
    expect(linksHome('booth', 'the-academy')).toBeUndefined();
  });
});
