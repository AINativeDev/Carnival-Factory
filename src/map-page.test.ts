// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMap } from './map-page';
import { switchFlags } from './test-support/feature-flags';
import { whenNamed } from './map-page-markup';
import { visit } from './page';
import {
  lastHud,
  lastMap,
  newPage,
  panels,
  pending,
  resetFakes,
  square,
} from './test-support/page-fakes';
import type { SandboxedSquare } from './northpole/sandbox';
import type { NorthPoleSquare } from './northpole/square';

vi.mock('./northpole/map', async () => (await import('./test-support/page-fakes')).mapModule);
vi.mock('./northpole/booths', async () => (await import('./test-support/page-fakes')).boothsModule);
vi.mock(
  './northpole/attractions',
  async () => (await import('./test-support/page-fakes')).attractionsModule,
);
vi.mock('./northpole/levels', async () => (await import('./test-support/page-fakes')).levelsModule);
vi.mock('./visit-hud', async () => (await import('./test-support/page-fakes')).visitModule);
vi.mock('./booths-hud', async () => (await import('./test-support/page-fakes')).boothsHudModule);
vi.mock('./pending', async () => (await import('./test-support/page-fakes')).pendingModule);

beforeEach(resetFakes);
afterEach(() => {
  vi.restoreAllMocks();
});

const click = (page: ReturnType<typeof newPage>, selector: string) => {
  page.app.querySelector<HTMLElement>(selector)?.click();
};

describe('renderMap', () => {
  it('lists every square in the guide by name and owner, as links inside them', () => {
    const page = newPage();
    renderMap(page);
    const guide = [...page.app.querySelectorAll('.map-guide a')].map((link) => [
      link.getAttribute('href'),
      link.textContent,
    ]);
    expect(guide).toEqual([
      ['#/attraction/ferris-wheel', 'Ferris wheel '],
      ['#/booth/ana', 'Cocoa @ana'],
      ['#/booth/bob', 'bob @bob'],
    ]);
    expect([document.body.dataset.view, page.shown]).toEqual(['map', '']);
  });

  it('leaves the sleigh station empty while the levels flag is off, and shows the booths being built', () => {
    const page = newPage();
    renderMap(page, { kind: 'booth', id: 'ana' });
    expect(lastMap().options.levels).toEqual([]);
    pending.show?.([]);
    expect(lastMap().setPending).toHaveBeenCalledWith([]);
    expect(pending.saved).toEqual([['carol']]);
    expect(page.app.querySelector<HTMLElement>('.map-note')?.hidden).toBe(true);
  });

  it("says when a linked square isn't on the map", () => {
    const page = newPage();
    renderMap(page, { kind: 'attraction', id: 'big-top' });
    expect(page.app.querySelector('.map-note')?.textContent).toMatch(
      /no attraction called "big-top"/,
    );
    renderMap(page, { kind: 'attraction', id: 'ferris-wheel' });
    expect(page.app.querySelector<HTMLElement>('.map-note')?.hidden).toBe(true);
  });

  it('folds the HUD on a phone and opens it on a wide map', () => {
    const page = newPage();
    renderMap(page);
    expect(page.app.querySelector<HTMLDetailsElement>('.hud-controls')?.open).toBe(false);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
    renderMap(page);
    expect(page.app.querySelector<HTMLDetailsElement>('.hud-controls')?.open).toBe(true);
  });

  it('walks to an open spot, shows the whole island, and comes back to the map from a square', () => {
    const page = newPage();
    renderMap(page);
    click(page, '.hud-claim');
    expect(lastMap().walkToOpenSpot).toHaveBeenCalled();
    click(page, '.hud-overview');
    expect(page.app.querySelector('.hud-overview')?.textContent).toBe('Back to the carnival');
    lastMap().overview = false;
    const picked = panels.at(-1)?.options.onPicked;
    if (typeof picked === 'function') (picked as () => void)();
    expect(page.app.querySelector('.hud-overview')?.textContent).toBe('Show the whole island');

    visit(page, 'booth', 'ana', false);
    click(page, '.hud-back');
    expect(lastHud().close).toHaveBeenCalled();
    expect(document.activeElement).toBe(page.app.querySelector('canvas'));
  });

  it('features the ferris wheel in the Booths panel, and stops it with the map', () => {
    const page = newPage();
    renderMap(page);
    const panel = panels.at(-1);
    expect(panel?.options.featured).toMatchObject({ kind: 'attraction' });
    const named = vi.fn();
    const whenNamedOption = panel?.options.whenNamed as
      ((square: NorthPoleSquare, show: () => void) => void) | undefined;
    whenNamedOption?.(square('ana'), named);
    expect(named).toHaveBeenCalled();
    page.stop?.();
    expect(
      [panel?.stop, pending.stop, lastMap().stop].every((stop) => vi.isMockFunction(stop)),
    ).toBe(true);
    expect(panel?.stop).toHaveBeenCalled();
    expect(pending.stop).toHaveBeenCalled();
    expect(page.panel).toBeUndefined();
  });
});

describe('whenNamed', () => {
  it("shows a sandboxed square's name once its frame says it, while its page is still showing", () => {
    const page = newPage();
    renderMap(page);
    let ready = () => undefined as unknown;
    const square = { id: 'ana', onReady: (then: () => void) => (ready = then) };
    const show = vi.fn();
    whenNamed(page.app, square as unknown as SandboxedSquare, show);
    ready();
    expect(show).toHaveBeenCalledTimes(2);
    page.app.replaceChildren();
    ready();
    expect(show).toHaveBeenCalledTimes(2);
  });
});

describe("renderMap, with participants' levels switched on", () => {
  switchFlags({ levels: true });
  it("puts a platform for each participant's level at the sleigh station", () => {
    renderMap(newPage(), { kind: 'booth', id: 'ana' });
    expect(lastMap().options.levels?.map((level) => [level.login, level.closed])).toEqual([
      ['ana', false],
      ['bob', true],
    ]);
  });
});
