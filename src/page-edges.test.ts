// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMap } from './map-page';
import { closeCard, visit } from './page';
import { huds, lastHud, newPage, panels, resetFakes } from './test-support/page-fakes';

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

/** A page with the North Pole's map on it, at `hash`. */
function onTheMap(hash = '#/') {
  const page = newPage(hash);
  renderMap(page);
  return page;
}

const call = (name: string) => {
  const option = lastHud().options[name];
  if (typeof option !== 'function') throw new Error(`No ${name}`);
  (option as () => void)();
};

beforeEach(resetFakes);
afterEach(() => {
  vi.restoreAllMocks();
});

describe("a square's panel, and who it's for", () => {
  it('invites only the visitor a shared link brought to that very booth', () => {
    const page = onTheMap();
    page.invite = 'ferris-wheel';
    visit(page, 'attraction', 'ferris-wheel', false);
    expect(lastHud().options).toMatchObject({ invite: false });
    page.invite = 'bob';
    visit(page, 'booth', 'ana', false);
    expect(lastHud().options).toMatchObject({ invite: false });
  });

  it("is never the visitor's own inside a level, or for an attraction", () => {
    const page = onTheMap();
    Object.assign(panels.at(-1) ?? {}, { me: 'igloo' });
    page.shown = 'ana';
    visit(page, 'booth', 'igloo', false);
    expect(lastHud().options).toMatchObject({ mine: false });
    page.shown = undefined;
    Object.assign(panels.at(-1) ?? {}, { me: 'ferris-wheel' });
    visit(page, 'attraction', 'ferris-wheel', false);
    expect(lastHud().options).toMatchObject({ mine: false });
  });
});

describe('leaving a square', () => {
  it('takes the address back off it, from Leave or from getting the spot next door', () => {
    const page = onTheMap('#/booth/ana');
    visit(page, 'booth', 'ana', false);
    call('onClose');
    expect(location.hash).toBe('#/');
    history.replaceState(null, '', '#/booth/ana');
    visit(page, 'booth', 'ana', false);
    const canvas = page.app.querySelector<HTMLElement>('.map-canvas');
    const focus = canvas ? vi.spyOn(canvas, 'focus') : undefined;
    call('onClaim');
    expect(location.hash).toBe('#/');
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('copes with a page whose map or canvas has gone', () => {
    const page = onTheMap();
    visit(page, 'booth', 'ana', false);
    page.map = undefined;
    page.app.querySelector('.map-canvas')?.remove();
    expect(() => {
      call('onClaim');
    }).not.toThrow();
    expect(page.card).toBeUndefined();
    huds.length = 0;
    visit(page, 'booth', 'ana', false);
    expect(huds).toHaveLength(0);
    expect(page.app.querySelector('.map-note')?.textContent).toBe(
      "There's no booth for @ana yet. Get a booth",
    );
  });
});

describe('closeCard', () => {
  it('closes a panel over a page with no map', () => {
    const page = onTheMap();
    visit(page, 'booth', 'ana', false);
    page.map = undefined;
    closeCard(page, false);
    expect(page.card).toBeUndefined();
  });
});
