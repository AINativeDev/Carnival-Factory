// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderKeepPosted } from './keep-posted';
import { route, startRouter } from './router';
import { renderSeason } from './season-card';
import { switchFlags } from './test-support/feature-flags';
import { huds, lastHud, lastMap, maps, newPage, resetFakes } from './test-support/page-fakes';

vi.mock('./northpole/map', async () => (await import('./test-support/page-fakes')).mapModule);
vi.mock('./northpole/booths', async () => (await import('./test-support/page-fakes')).boothsModule);
vi.mock(
  './northpole/attractions',
  async () => (await import('./test-support/page-fakes')).attractionsModule,
);
vi.mock('./northpole/levels', async () => (await import('./test-support/page-fakes')).levelsModule);
vi.mock('./northpole/level', async (original) => ({
  ...(await original<typeof import('./northpole/level')>()),
  levelWorld: () => ({}),
}));
vi.mock('./visit-hud', async () => (await import('./test-support/page-fakes')).visitModule);
vi.mock('./factory', async () => (await import('./test-support/page-fakes')).factoryModule);
vi.mock('./advent', async () => (await import('./test-support/page-fakes')).adventModule);
vi.mock('./booths-hud', async () => (await import('./test-support/page-fakes')).boothsHudModule);
vi.mock('./pending', async () => (await import('./test-support/page-fakes')).pendingModule);
vi.mock('./level-panel', () => ({ openLevelPanel: vi.fn() }));
vi.mock('./season-card', () => ({ renderSeason: vi.fn(() => vi.fn()) }));
vi.mock('./keep-posted', () => ({ renderKeepPosted: vi.fn() }));

const HASH_CHANGE = new HashChangeEvent('hashchange');
/** Goes to `hash` as a click on a link would, without the page's own listener hearing it. */
const go = (page: ReturnType<typeof newPage>, hash: string) => {
  history.replaceState(null, '', hash);
  route(page, HASH_CHANGE);
};

beforeEach(resetFakes);
afterEach(() => {
  vi.clearAllMocks();
});

describe('startRouter', () => {
  it('invites a visitor a shared booth link brought, and follows the address', () => {
    for (const [hash, invite] of [
      ['#/booth/ana', 'ana'],
      ['#/?booth=bob', 'bob'],
      ['#/?attraction=ferris-wheel', undefined],
      ['#/attraction/ferris-wheel', undefined],
    ] as const) {
      const page = startRouter(newPage(hash).app, new Set());
      expect(page.invite).toBe(invite);
    }
    expect(lastHud().options).toMatchObject({ kind: 'attraction', invite: false });
    const page = startRouter(newPage('#/booth/ana').app, new Set());
    expect(lastHud().options).toMatchObject({ kind: 'booth', invite: true });
    history.replaceState(null, '', '#/factory');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(lastHud().kind).toBe('factory');
    expect(page.cardFromHistory).toBe(false);
  });
});

describe('route', () => {
  it('opens the map, and goes inside a square, remembering whether the map was behind it', () => {
    const page = newPage();
    route(page);
    expect([page.shown, maps.length]).toEqual(['', 1]);
    go(page, '#/booth/ana');
    expect(lastMap().visit).toHaveBeenCalledWith('booth', 'ana');
    expect(page.cardFromHistory).toBe(true);
    go(page, '#/attraction/ferris-wheel');
    expect(page.cardFromHistory).toBe(false);
    expect(huds.map((hud) => hud.kind)).toEqual(['visit', 'visit']);
    expect(maps).toHaveLength(1);
  });

  it('comes out of a square onto the map, in front of the square a link names', () => {
    const page = newPage('#/booth/ana');
    route(page);
    go(page, '#/?booth=bob');
    expect(lastHud().close).toHaveBeenCalled();
    expect(lastMap().jumpTo).toHaveBeenCalledWith('booth', 'bob');
    go(page, '#/booth/ana');
    go(page, '#/');
    expect(lastMap().jumpTo).toHaveBeenCalledTimes(1);
    // With nothing open, the map starts again.
    go(page, '#/');
    expect(maps).toHaveLength(2);
    expect(maps[0]?.stop).toHaveBeenCalled();
  });

  describe('with the advent calendar switched on', () => {
    switchFlags({ advent: true });
    it('shows the factory and the advent calendar over the map, starting it when it is not running', () => {
      const page = newPage('#/season/ana');
      route(page);
      const stopSeason = page.stop;
      go(page, '#/factory');
      expect(stopSeason).toHaveBeenCalled();
      expect([maps.length, lastHud().kind]).toEqual([1, 'factory']);
      go(page, '#/advent');
      expect([maps.length, lastHud().kind]).toEqual([1, 'advent']);
      page.stop?.();
      page.map = undefined;
      go(page, '#/advent');
      expect(maps).toHaveLength(2);
    });
  });

  it("shows the plain map at the advent calendar's address while its feature flag is off", () => {
    const page = newPage('#/advent');
    route(page);
    expect(maps).toHaveLength(1);
    expect(huds).toHaveLength(0);
  });

  it('gives a page of its own to a season card and to Keep me posted, stopping the map', () => {
    const page = newPage('#/booth/ana');
    route(page);
    go(page, '#/season/ana');
    expect(renderSeason).toHaveBeenCalledWith(page.app, 'ana');
    expect(maps[0]?.stop).toHaveBeenCalled();
    expect(page.map).toBeUndefined();
    go(page, '#/keep-posted');
    expect(renderKeepPosted).toHaveBeenCalledWith(page.app);
    expect(page.stop).toBeUndefined();
    go(page, '#/booth/bob');
    expect(maps).toHaveLength(2);
  });

  it('keeps links from when booths were spots working', () => {
    const page = newPage('#/spot/ana');
    route(page);
    expect(location.hash).toBe('#/booth/ana');
    expect(maps).toHaveLength(0);
    expect(lastMap).toThrow('No map started');
    expect(lastHud).toThrow('No panel opened');
  });

  it('lets pass the hash change it made itself', () => {
    const page = newPage('#/factory');
    page.ignoreNextRoute = true;
    route(page);
    expect([page.ignoreNextRoute, maps.length]).toEqual([false, 0]);
  });
});
