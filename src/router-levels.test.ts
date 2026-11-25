// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { route } from './router';
import { lastHud, lastMap, maps, newPage, resetFakes } from './test-support/page-fakes';

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
vi.mock('./booths-hud', async () => (await import('./test-support/page-fakes')).boothsHudModule);
vi.mock('./pending', async () => (await import('./test-support/page-fakes')).pendingModule);
vi.mock('./level-panel', () => ({ openLevelPanel: vi.fn() }));

const go = (page: ReturnType<typeof newPage>, hash: string) => {
  history.replaceState(null, '', hash);
  route(page, new HashChangeEvent('hashchange'));
};

beforeEach(resetFakes);
afterEach(() => {
  vi.clearAllMocks();
});

describe('route, in a level', () => {
  it("opens a level's world, goes inside one of its squares and out in front of another", () => {
    const page = newPage('#/level/ana/igloo');
    route(page);
    expect([page.shown, maps.length]).toEqual(['ana', 1]);
    expect(lastMap().visit).toHaveBeenCalledWith('attraction', 'igloo');
    expect(lastHud().options).toMatchObject({ level: 'ana' });

    go(page, '#/level/ana?square=igloo');
    expect(lastHud().close).toHaveBeenCalled();
    expect(lastMap().jumpTo).toHaveBeenCalledWith('attraction', 'igloo');
    go(page, '#/level/ana/igloo');
    go(page, '#/level/ana');
    expect(lastMap().jumpTo).toHaveBeenCalledTimes(1);
    go(page, '#/level/ana?square=igloo');
    expect(lastMap().jumpTo).toHaveBeenCalledTimes(2);
    go(page, '#/level/ana');
    expect(maps).toHaveLength(1);
  });

  it('starts the North Pole again on the way home, and another level on the way there', () => {
    const page = newPage('#/');
    route(page);
    go(page, '#/level/ana');
    expect(maps[0]?.stop).toHaveBeenCalled();
    go(page, '#/booth/ana');
    expect([page.shown, maps.length]).toEqual(['', 3]);
    expect(lastMap().visit).toHaveBeenCalledWith('booth', 'ana');
  });

  it("stays on the North Pole's map for a level that is closed, and goes nowhere inside it", () => {
    const page = newPage('#/level/bob/igloo');
    route(page);
    expect(page.shown).toBe('');
    expect(lastMap().visit).not.toHaveBeenCalled();
    expect(page.app.querySelector('.map-note')?.textContent).toBe(
      "@bob's level is closed for repairs.",
    );
  });
});
