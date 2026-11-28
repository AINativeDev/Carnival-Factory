import { describe, expect, it } from 'vitest';
import {
  allowedLinkOut,
  httpsOnly,
  linksHome,
  NORTH_POLE_LINKS,
  northPoleLinks,
  visitablePlace,
} from './north-pole-links';
import { isNorthPoleLevel } from './north-pole-levels';
import { BOOTH_REQUEST_URL, withUtm, YEAR_IN_REVIEW_URL } from './links';
import { SETTINGS } from '../settings';

/** The ways on after an explainer, tagged with its place, except the booth form, which is this repository's own. */
const waysOn = (place: string) => {
  const tag = `utm_source=carnival-factory&utm_medium=${place}&utm_campaign=christmas-edition`;
  return [
    { label: 'Ask for a booth', href: BOOTH_REQUEST_URL },
    { label: 'Get AI DevCon tickets', href: withUtm(SETTINGS.aiDevcon.tickets, place) },
    { label: 'Read the Tessl blog', href: `https://tessl.io/blog?${tag}` },
    { label: 'Listen to the podcast', href: `https://tessl.io/podcast/?${tag}` },
  ];
};

const levelFolders = Object.keys(import.meta.glob('../../carnival/levels/*/level.ts')).map(
  (path) => path.split('/').at(-2) ?? '',
);

describe("the North Pole's own links out", () => {
  it('starts the Academy from The Academy, then offers the same ways on as the Factory', () => {
    const academy = northPoleLinks('the-academy');
    expect(academy[0]).toEqual({
      label: 'Start the Academy',
      href: 'https://tessl.io/academy?utm_source=carnival-factory&utm_medium=the-academy&utm_campaign=christmas-edition',
    });
    expect(academy.slice(1)).toEqual(waysOn('the-academy'));
  });

  it("keeps the order the explainers' games ask by", () => {
    for (const place of ['the-factory', 'the-academy'])
      expect(
        northPoleLinks(place)
          .map(({ label }) => label)
          .slice(1),
      ).toEqual([
        'Ask for a booth',
        'Get AI DevCon tickets',
        'Read the Tessl blog',
        'Listen to the podcast',
      ]);
  });

  it('opens the podcast and the YouTube channel from The Recording Studio', () => {
    expect(northPoleLinks('the-studio')).toEqual([
      {
        label: 'Listen to the podcast',
        href: 'https://tessl.io/podcast/?utm_source=carnival-factory&utm_medium=the-studio&utm_campaign=christmas-edition',
      },
      {
        label: 'Watch on YouTube',
        href: 'https://www.youtube.com/@tessl-ai?utm_source=carnival-factory&utm_medium=the-studio&utm_campaign=christmas-edition',
      },
    ]);
  });

  it('asks for your answer in the Year in Review, on its own form', () => {
    expect(northPoleLinks('the-year-in-review')).toEqual([
      { label: 'Add your answer', href: YEAR_IN_REVIEW_URL },
    ]);
    expect(YEAR_IN_REVIEW_URL).toMatch(/\/issues\/new\?template=07-year-in-review\.yml$/);
  });

  it("gives links only to the North Pole's own places, never a participant's level", () => {
    // AI DevCon's room is the one place with links that isn't a level.
    for (const id of Object.keys(NORTH_POLE_LINKS))
      expect(isNorthPoleLevel(id) || id === 'ai-devcon').toBe(true);
    const participants = levelFolders.filter((id) => !isNorthPoleLevel(id));
    expect(participants).toContain('jedi4ever');
    for (const id of participants) expect(northPoleLinks(id)).toEqual([]);
    expect(northPoleLinks('constructor')).toEqual([]);
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

describe('links of their own', () => {
  it("give the Factory its signup and AI DevCon's room its tickets, tagged with the place", () => {
    expect(northPoleLinks('the-factory')).toEqual([
      {
        label: 'Sign up for Tessl',
        href: 'https://tessl.io/login?utm_source=carnival-factory&utm_medium=the-factory&utm_campaign=christmas-edition',
      },
      ...waysOn('the-factory'),
    ]);
    expect(linksHome('attraction', 'ai-devcon')).toBe('ai-devcon');
    expect(northPoleLinks('ai-devcon')[0]?.label).toBe('Get tickets');
    expect(linksHome('booth', 'ai-devcon')).toBeUndefined();
    expect(linksHome('attraction', 'constructor')).toBeUndefined();
    expect(northPoleLinks('constructor')).toEqual([]);
  });
});

describe("the North Pole's links out, tagged", () => {
  it('leaves the Year in Review form, on GitHub, as it is', () => {
    expect(northPoleLinks('the-year-in-review')).toEqual([
      { label: 'Add your answer', href: YEAR_IN_REVIEW_URL },
    ]);
  });
});

describe('the addresses a link out may open', () => {
  it("are the North Pole's own, tagged, and nothing else, not even the same site untagged", () => {
    const signup = northPoleLinks('the-factory')[0]?.href ?? '';
    expect(allowedLinkOut(signup)).toBe(signup);
    expect(allowedLinkOut('https://tessl.io/login')).toBeUndefined();
    expect(allowedLinkOut('https://evil.example/')).toBeUndefined();
    expect(allowedLinkOut('')).toBeUndefined();
  });
});

describe('the places a game may send a visitor on to', () => {
  it("are the North Pole's places with links of their own, as the list's own copy", () => {
    for (const place of ['the-factory', 'the-academy', 'the-studio', 'ai-devcon']) {
      expect(visitablePlace(place)).toBe(place);
      expect(northPoleLinks(place).length).toBeGreaterThan(0);
    }
    for (const place of ['ferris-wheel', 'the-year-in-review', 'jedi4ever', 'constructor', ''])
      expect(visitablePlace(place)).toBeUndefined();
  });
});
