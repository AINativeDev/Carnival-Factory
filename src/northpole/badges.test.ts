import { describe, expect, it } from 'vitest';
import {
  BADGE_HOLDERS,
  badgeFor,
  badgeImage,
  badgeSnippet,
  cleanHolders,
  factoryUrl,
  isRepo,
} from './badges';

describe('cleanHolders', () => {
  it('keeps well-formed holders, logins in lower case', () => {
    expect(
      cleanHolders([
        { login: 'Jedi4ever', repo: 'jedi4ever/factory', tier: 'gold' },
        { login: 'sjmaple', repo: 'sjmaple/app' },
      ]),
    ).toEqual([
      { login: 'jedi4ever', repo: 'jedi4ever/factory', tier: 'gold' },
      { login: 'sjmaple', repo: 'sjmaple/app' },
    ]);
  });

  it('drops anything malformed, and an unknown tier', () => {
    expect(cleanHolders('nope')).toEqual([]);
    expect(
      cleanHolders([
        null,
        { login: '<b>hi</b>', repo: 'a/b' },
        { login: 'ok', repo: 'javascript:alert(1)' },
        { login: 'ok', repo: 'a/b/c' },
        { login: 'ok', repo: 'a/..' },
        { login: 'ok', repo: 'a/b', tier: 'platinum' },
      ]),
    ).toEqual([{ login: 'ok', repo: 'a/b' }]);
  });

  it('lets the last entry for a login win', () => {
    expect(
      cleanHolders([
        { login: 'a', repo: 'a/one', tier: 'bronze' },
        { login: 'A', repo: 'a/two', tier: 'silver' },
      ]),
    ).toEqual([{ login: 'a', repo: 'a/two', tier: 'silver' }]);
  });
});

describe('isRepo', () => {
  it('takes owner/name only', () => {
    expect(isRepo('octocat/hello-world.js')).toBe(true);
    expect(isRepo('octocat')).toBe(false);
    expect(isRepo('-bad/name')).toBe(false);
    expect(isRepo('octocat/hello world')).toBe(false);
  });
});

describe('badgeFor', () => {
  const holders = cleanHolders([{ login: 'jedi4ever', repo: 'jedi4ever/factory' }]);

  it("finds a booth owner's badge, whatever the case", () => {
    expect(badgeFor('Jedi4ever', holders)?.repo).toBe('jedi4ever/factory');
    expect(badgeFor('sjmaple', holders)).toBeUndefined();
  });

  it('has nobody without a build that read the holders', () => {
    expect(BADGE_HOLDERS).toEqual([]);
  });
});

describe('the badge on the site', () => {
  it("links to the holder's repository", () => {
    expect(factoryUrl({ login: 'a', repo: 'a/my.repo' })).toBe('https://github.com/a/my.repo');
  });

  it('has an image per tier, with no query string', () => {
    expect(badgeImage()).toBe('badges/elf-engineer.svg');
    expect(badgeImage('gold')).toBe('badges/elf-engineer-gold.svg');
  });

  it('gives a snippet that shows the badge and links back to the map', () => {
    const site = 'https://ainativedev.github.io/Carnival-Factory/';
    expect(badgeSnippet(site, 'silver')).toBe(
      `[![Elf Engineer: silver](${site}badges/elf-engineer-silver.svg)](${site})`,
    );
  });
});
