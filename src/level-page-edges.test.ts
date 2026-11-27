// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jumpInLevel, renderLevel } from './level-page';
import { visit } from './page';
import { lastMap, levelsModule, newPage, resetFakes, square } from './test-support/page-fakes';

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

/** Ana's level, with a second square for as long as a test needs it. */
const ana = () => {
  const entry = levelsModule.levelOf('ana');
  if (!entry) throw new Error('no level for ana');
  return entry;
};

beforeEach(() => {
  resetFakes();
  ana().squares.push(square('shed', 'Shed'));
});
afterEach(() => {
  ana().squares.pop();
  vi.restoreAllMocks();
});

const note = (page: ReturnType<typeof newPage>) => page.app.querySelector<HTMLElement>('.map-note');

describe("a level's page", () => {
  it('shows the map view, walking only the squares of a level that is not a ride', () => {
    const page = newPage();
    renderLevel(page, 'ana', 'shed');
    expect(document.body.dataset.view).toBe('map');
    const { options } = lastMap();
    expect(options.booths).toEqual([]);
    expect(options.level?.ride).toBe(false);
    expect(options.focus).toEqual({ kind: 'attraction', id: 'shed' });
    expect(note(page)?.hidden).toBe(true);
  });

  it('jumps to any one of its squares', () => {
    const page = newPage();
    renderLevel(page, 'ana');
    jumpInLevel(page, 'ana', 'shed');
    expect(lastMap().jumpTo).toHaveBeenCalledWith('attraction', 'shed');
  });

  it("says a level that isn't there has no such square", () => {
    const page = newPage();
    renderLevel(page, 'ana');
    jumpInLevel(page, 'nobody', 'shed');
    expect(note(page)?.textContent).toBe('nobody has no square called "shed".');
  });

  it("cuts a long name from the address to a login's length", () => {
    const page = newPage();
    renderLevel(page, 'x'.repeat(60));
    expect(note(page)?.textContent).toBe(`There's no level for @${'x'.repeat(39)} yet.`);
  });

  it('takes the address back off a square on leaving it, but not when the page moves on', () => {
    const page = newPage('#/level/ana');
    renderLevel(page, 'ana');
    history.replaceState(null, '', '#/level/ana/shed');
    visit(page, 'attraction', 'shed', false);
    lastMap().options.onLeave();
    expect(location.hash).toBe('#/level/ana');
    history.replaceState(null, '', '#/level/ana/shed');
    visit(page, 'attraction', 'shed', false);
    history.replaceState(null, '', '#/factory');
    page.stop?.();
    expect(location.hash).toBe('#/factory');
  });
});
