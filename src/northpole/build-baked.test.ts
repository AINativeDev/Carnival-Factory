import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * What the build bakes into the page (vite.config.ts `define`): the advent
 * counts, the badge holders and the People's Choice standings. Each module
 * reads its value once, when it loads, so each test sets the value and loads
 * the module afresh. The values are untrusted JSON, so each is cleaned on the
 * way in. Loaded without a build, as the smoke test loads the map's drawing in
 * Node, nothing is baked in, and each module starts empty.
 */
const REPO = 'https://github.com/AINativeDev/Carnival-Factory';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('the advent counts the build found', () => {
  it("gives each owner their count, in any case, and nobody else's", async () => {
    vi.stubGlobal('__ADVENT_COUNTS__', { Ana: 3, 'not a login!': 4 });
    const { adventCountFor } = await import('./advent');
    expect(adventCountFor('ana')).toBe(3);
    expect(adventCountFor('ANA')).toBe(3);
    expect(adventCountFor('bob')).toBe(0);
  });

  it('gives everyone none when nothing was baked in', async () => {
    vi.stubGlobal('__ADVENT_COUNTS__', undefined);
    const { adventCountFor } = await import('./advent');
    expect(adventCountFor('ana')).toBe(0);
  });
});

describe('the badge holders the build found', () => {
  it('keeps the well-formed holders, by login in lower case', async () => {
    vi.stubGlobal('__BADGE_HOLDERS__', [
      { login: 'Ana', repo: 'ana/factory', tier: 'gold' },
      { login: 'bob', repo: 42 },
    ]);
    const { BADGE_HOLDERS, badgeFor } = await import('./badges');
    expect(BADGE_HOLDERS).toEqual([{ login: 'ana', repo: 'ana/factory', tier: 'gold' }]);
    expect(badgeFor('ANA')?.repo).toBe('ana/factory');
    expect(badgeFor('bob')).toBeUndefined();
  });

  it('has nobody holding it when nothing was baked in', async () => {
    vi.stubGlobal('__BADGE_HOLDERS__', undefined);
    const { BADGE_HOLDERS } = await import('./badges');
    expect(BADGE_HOLDERS).toEqual([]);
  });
});

describe("the People's Choice standings the build found", () => {
  it('keeps the ballot and its entries when they point into this repository', async () => {
    vi.stubGlobal('__PEOPLES_CHOICE__', {
      ballot: `${REPO}/issues/7`,
      booths: [{ login: 'ana', url: `${REPO}/issues/7#issuecomment-1`, votes: 2 }],
      factories: [],
    });
    const { PEOPLES_CHOICE } = await import('./peoples-choice-standings');
    expect(PEOPLES_CHOICE?.ballot).toBe(`${REPO}/issues/7`);
    expect(PEOPLES_CHOICE?.booths.map((entry) => entry.login)).toEqual(['ana']);
  });

  it('has no standings when the build found no ballot, or baked nothing in', async () => {
    vi.stubGlobal('__PEOPLES_CHOICE__', { booths: [] });
    expect((await import('./peoples-choice-standings')).PEOPLES_CHOICE).toBeUndefined();
    vi.resetModules();
    vi.stubGlobal('__PEOPLES_CHOICE__', undefined);
    expect((await import('./peoples-choice-standings')).PEOPLES_CHOICE).toBeUndefined();
  });
});

describe("the Year in Review's answers the build found", () => {
  it('keeps the clean answers of the room’s items, and nothing else', async () => {
    const answer = { login: 'ana', answer: 'Yes.', at: '2026-11-20T00:00:00Z' };
    vi.stubGlobal('__YEAR_IN_REVIEW__', { 'hot-take': [answer], 'not-an-item': [answer] });
    const { YEAR_ANSWERS } = await import('./year-in-review-answers');
    expect(YEAR_ANSWERS).toEqual({ 'hot-take': [answer] });
  });

  it('has none when nothing was baked in', async () => {
    vi.stubGlobal('__YEAR_IN_REVIEW__', undefined);
    const { YEAR_ANSWERS } = await import('./year-in-review-answers');
    expect(YEAR_ANSWERS).toEqual({});
  });
});
