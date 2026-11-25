// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMap } from './map-page';
import { closeCard, showAdvent, showFactory, visit } from './page';
import { lastHud, lastMap, newPage, panels, resetFakes } from './test-support/page-fakes';

vi.mock('./northpole/map', async () => (await import('./test-support/page-fakes')).mapModule);
vi.mock('./northpole/booths', async () => (await import('./test-support/page-fakes')).boothsModule);
vi.mock(
  './northpole/attractions',
  async () => (await import('./test-support/page-fakes')).attractionsModule,
);
vi.mock('./northpole/levels', async () => (await import('./test-support/page-fakes')).levelsModule);
vi.mock('./visit-hud', async () => (await import('./test-support/page-fakes')).visitModule);
vi.mock('./factory', async () => (await import('./test-support/page-fakes')).factoryModule);
vi.mock('./advent', async () => (await import('./test-support/page-fakes')).adventModule);
vi.mock('./booths-hud', async () => (await import('./test-support/page-fakes')).boothsHudModule);
vi.mock('./pending', async () => (await import('./test-support/page-fakes')).pendingModule);

/** A page with the North Pole's map on it. */
function onTheMap() {
  const page = newPage();
  renderMap(page);
  return page;
}

/** Calls one of the options the panel was opened with. */
const call = (name: string) => {
  const option = lastHud().options[name];
  if (typeof option !== 'function') throw new Error(`No ${name}`);
  (option as () => void)();
};

beforeEach(resetFakes);
afterEach(() => {
  vi.restoreAllMocks();
});

describe('visit', () => {
  it("opens a square's panel, which can say it's yours, close, or get the spot next door", () => {
    const page = onTheMap();
    page.invite = 'ana';
    visit(page, 'booth', 'ana', false);
    expect(lastHud().options).toMatchObject({ kind: 'booth', invite: true });
    expect(lastHud().options).not.toHaveProperty('level');
    expect(page.app.querySelector<HTMLElement>('.map-note')?.hidden).toBe(true);
    call('onMine');
    expect(panels.at(-1)?.setMe).toHaveBeenCalledWith('ana');

    call('onClose');
    expect([page.card, page.invite]).toEqual([undefined, undefined]);
    expect(lastMap().leave).toHaveBeenCalled();

    visit(page, 'attraction', 'ferris-wheel', false);
    expect(lastHud().options).toMatchObject({ invite: false });
    call('onClaim');
    expect(lastMap().claimNextDoor).toHaveBeenCalled();
    expect(document.activeElement).toBe(page.app.querySelector('.map-canvas'));
    page.panel = undefined;
    visit(page, 'booth', 'bob', false);
    call('onMine');
  });

  it("tells a booth's panel when it's the visitor's own, so it offers them a level next", () => {
    const page = onTheMap();
    Object.assign(panels.at(-1) ?? {}, { me: 'ana' });
    visit(page, 'booth', 'ana', false);
    expect(lastHud().options).toMatchObject({ mine: true });
    visit(page, 'booth', 'bob', false);
    expect(lastHud().options).toMatchObject({ mine: false });
    page.shown = 'ana';
    visit(page, 'attraction', 'ana', false);
    expect(lastHud().options).toMatchObject({ mine: false });
  });

  it("says on the map, or in the level, when a square isn't there or the map can't go in", () => {
    const page = onTheMap();
    const note = () => page.app.querySelector('.map-note')?.textContent;
    visit(page, 'attraction', 'big-top', false);
    expect(note()).toBe('The North Pole has no attraction called "big-top".');
    lastMap().visit.mockReturnValueOnce(false);
    visit(page, 'booth', 'ana', false);
    expect(note()).toBe("There's no booth for @ana yet. Get a booth");
    page.shown = 'ana';
    visit(page, 'attraction', 'shed', false);
    expect(note()).toBe('Ana land has no square called "shed".');
    page.shown = 'zed';
    visit(page, 'attraction', 'shed', false);
    expect(note()).toBe('zed has no square called "shed".');
  });
});

describe('closeCard', () => {
  it('takes the address back off a visit: back in history when the map was behind it, or in place', () => {
    const page = onTheMap();
    const back = vi.spyOn(history, 'back').mockImplementation(() => undefined);
    visit(page, 'booth', 'ana', true);
    closeCard(page, true);
    expect([back.mock.calls.length, page.ignoreNextRoute]).toEqual([1, true]);

    page.ignoreNextRoute = false;
    history.replaceState(null, '', '#/booth/ana');
    visit(page, 'booth', 'ana', false);
    closeCard(page, true);
    expect([location.hash, page.ignoreNextRoute]).toEqual(['#/', false]);

    page.shown = 'ana';
    visit(page, 'attraction', 'igloo', false);
    closeCard(page, true);
    expect(location.hash).toBe('#/level/ana');
    // With nothing open, there's nothing to close.
    closeCard(page, true);
    expect(back).toHaveBeenCalledTimes(1);
  });
});

describe('the factory and the advent calendar', () => {
  it('open over the map, counting its squares, and close back to it', () => {
    const page = onTheMap();
    showFactory(page, true);
    expect(lastHud().options).toMatchObject({
      squares: { booths: 2, attractions: 1, people: 2 },
    });
    expect(page.cardFromHistory).toBe(true);
    call('onClose');
    expect(page.card).toBeUndefined();
    showAdvent(page, false);
    expect(lastHud().kind).toBe('advent');
    expect(lastHud().options.now).toBeInstanceOf(Date);
    call('onClose');
    expect(page.card).toBeUndefined();
  });
});
