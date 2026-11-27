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

describe('cleanHolders, at the edges of a login', () => {
  const holder = (login: unknown, repo: unknown = 'a/b') => ({ login, repo });

  it('takes a login of up to 39 letters, digits and single hyphens inside', () => {
    const longest = 'a'.repeat(39);
    expect(cleanHolders([holder(longest), holder('a-b-c'), holder('7')])).toEqual([
      { login: longest, repo: 'a/b' },
      { login: 'a-b-c', repo: 'a/b' },
      { login: '7', repo: 'a/b' },
    ]);
  });

  it('turns down a longer login, hyphens at either end or doubled, and anything not text', () => {
    const logins = ['a'.repeat(40), '-ab', 'ab-', 'a--b', '', 'a.b', 'x<y', 7, undefined];
    expect(cleanHolders(logins.map((login) => holder(login)))).toEqual([]);
    expect(cleanHolders([holder('ok', 7), holder('ok', ['a/b']), 'ok', 7])).toEqual([]);
    expect(cleanHolders([Object.assign(() => 0, holder('ok'))])).toEqual([]);
    expect(cleanHolders({ 0: holder('ok') })).toEqual([]);
  });

  it('moves a login given again to where its last entry stands', () => {
    expect(
      cleanHolders([holder('amy', 'amy/one'), holder('bob'), holder('Amy', 'amy/two')]),
    ).toEqual([
      { login: 'bob', repo: 'a/b' },
      { login: 'amy', repo: 'amy/two' },
    ]);
  });

  it('keeps every known tier, and nothing that only looks like one', () => {
    const tiers = cleanHolders(
      ['bronze', 'silver', 'gold', 'Gold', ['gold']].map((tier, n) => ({
        login: `elf-${n}`,
        repo: 'a/b',
        tier,
      })),
    ).map((entry) => entry.tier);
    expect(tiers).toEqual(['bronze', 'silver', 'gold', undefined, undefined]);
  });
});

describe('isRepo', () => {
  it('takes an owner of up to 39 characters and a name of up to 100', () => {
    expect(isRepo(`${'a'.repeat(39)}/b`)).toBe(true);
    expect(isRepo(`${'a'.repeat(40)}/b`)).toBe(false);
    expect(isRepo(`a/${'b'.repeat(100)}`)).toBe(true);
    expect(isRepo(`a/${'b'.repeat(101)}`)).toBe(false);
    expect(isRepo('Oct-o-Cat/My_Repo.v2')).toBe(true);
    expect(isRepo('a/')).toBe(false);
  });

  it('turns down an owner with a hyphen at either end or doubled', () => {
    for (const repo of ['a-/b', 'a--b/c', ' a/b', 'a/b ', 'a/b\nc/d'])
      expect(isRepo(repo), repo).toBe(false);
  });

  it('turns down a name that is only a dot or two, and nothing else with dots', () => {
    expect(isRepo('a/.')).toBe(false);
    expect(isRepo('a/..')).toBe(false);
    expect(isRepo('a/...')).toBe(true);
    expect(isRepo('a/.x')).toBe(true);
    expect(isRepo('a/x.')).toBe(true);
  });

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
    expect(badgeSnippet(site)).toBe(`[![Elf Engineer](${site}badges/elf-engineer.svg)](${site})`);
    expect(badgeSnippet(site, 'silver')).toBe(
      `[![Elf Engineer: silver](${site}badges/elf-engineer-silver.svg)](${site})`,
    );
  });
});
