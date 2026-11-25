// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jumpInLevel, renderLevel } from './level-page';
import { visit } from './page';
import { lastHud, lastMap, levelsModule, newPage, resetFakes } from './test-support/page-fakes';

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

beforeEach(resetFakes);
afterEach(() => {
  vi.restoreAllMocks();
});

const note = (page: ReturnType<typeof newPage>) => page.app.querySelector<HTMLElement>('.map-note');

describe('renderLevel', () => {
  it("rides a ride level's coaster, with the ride's keys in its Controls", () => {
    const level = levelsModule.levelOf('ana')?.level;
    if (!level) throw new Error('no level for ana');
    level.ride = true;
    try {
      const page = newPage();
      renderLevel(page, 'ana');
      expect(lastMap().options.level).toMatchObject({ id: 'ana', ride: true });
      const controls = page.app.querySelector('.hud-controls p')?.textContent;
      expect(controls).toContain('to ride on to the next station');
      expect(controls).not.toContain('Walk with');
    } finally {
      delete level.ride;
    }
  });

  it("walks the level's own world, with its squares and the sleigh home", () => {
    const page = newPage();
    renderLevel(page, 'ana');
    const { options } = lastMap();
    expect(page.shown).toBe('ana');
    expect(options.level).toMatchObject({ id: 'ana', name: 'Ana land' });
    expect(options.attractions.map((square) => square.id)).toEqual(['igloo']);
    expect(options.focus).toBeUndefined();
    options.onOpen('attraction', 'igloo');
    expect(location.hash).toBe('#/level/ana/igloo');
    options.onTravel?.(undefined);
    expect(location.hash).toBe('#/');
    options.onTravel?.('bob');
    expect(location.hash).toBe('#/level/bob');

    visit(page, 'attraction', 'igloo', false);
    options.onLeave();
    expect(lastHud().close).toHaveBeenCalled();
    page.stop?.();
    expect(lastMap().stop).toHaveBeenCalled();
  });

  it("puts the player in front of a square a link names, or says it isn't there", () => {
    const page = newPage();
    renderLevel(page, 'ana', 'igloo');
    expect(lastMap().options.focus).toEqual({ kind: 'attraction', id: 'igloo' });
    renderLevel(page, 'ana', 'shed');
    expect(lastMap().options.focus).toBeUndefined();
    expect(note(page)?.textContent).toBe('Ana land has no square called "shed".');
  });

  it("says on the North Pole's map when a level is closed or isn't there", () => {
    const page = newPage();
    renderLevel(page, 'bob');
    expect(page.shown).toBe('');
    expect(note(page)?.textContent).toBe("@bob's level is closed for repairs.");
    renderLevel(page, 'nobody');
    expect(note(page)?.textContent).toBe("There's no level for @nobody yet.");
    expect(note(page)?.hidden).toBe(false);
  });
});

describe('jumpInLevel', () => {
  it("moves the player to one of the level's squares, or says it isn't there", () => {
    const page = newPage();
    renderLevel(page, 'ana', 'shed');
    jumpInLevel(page, 'ana', 'igloo');
    expect(lastMap().jumpTo).toHaveBeenCalledWith('attraction', 'igloo');
    expect(note(page)?.hidden).toBe(true);
    jumpInLevel(page, 'ana', 'shed');
    expect(note(page)?.hidden).toBe(false);
    page.map = undefined;
    jumpInLevel(page, 'ana', 'igloo');
    expect(note(page)?.hidden).toBe(true);
  });
});
