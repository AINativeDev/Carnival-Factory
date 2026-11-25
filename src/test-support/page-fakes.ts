/**
 * Stand-ins for what the page's router and its pages start (src/router.ts,
 * src/page.ts, src/map-page.ts, src/level-page.ts): the map, the panels over
 * it, the registries of squares and levels. Each records what it was asked,
 * so the tests can check the wiring without a canvas or a sandbox. A test
 * file mocks the real modules with these, in its own `vi.mock` calls.
 */
import { vi } from 'vitest';
import type { LevelEntry } from '../northpole/levels';
import type { NorthPoleLevel } from '../northpole/level';
import type { MapOptions } from '../northpole/map-options';
import type { NorthPoleSquare } from '../northpole/square';
import type { Page } from '../page';

export const square = (id: string, name = id): NorthPoleSquare => ({
  id,
  name,
  description: '',
  draw: () => undefined,
});

const registry = (squares: NorthPoleSquare[]) => ({
  get: (id: string) => squares.find((one) => one.id === id),
  all: () => squares,
});

/** The North Pole in these tests: two booths, one attraction. */
export const boothsModule = { boothRegistry: registry([square('ana', 'Cocoa'), square('bob')]) };
export const attractionsModule = {
  attractionRegistry: registry([square('ferris-wheel', 'Ferris wheel')]),
};

/** Ana's open level with an igloo, and Bob's, closed for repairs. */
const LEVELS: LevelEntry[] = [
  {
    login: 'ana',
    name: 'Ana land',
    description: '',
    owner: '@ana',
    level: { id: 'ana', name: 'Ana land', description: '', theme: 'dusk' } as NorthPoleLevel,
    squares: [square('igloo', 'Igloo')],
  },
  { login: 'bob', name: 'bob', description: '', owner: '@bob', squares: [] },
];
export const levelsModule = {
  levels: LEVELS,
  levelOf: (login: string) => LEVELS.find((entry) => entry.login === login),
};

/** A map that records what it was started with and asked to do. */
export function fakeMap(options: MapOptions) {
  const map = {
    options,
    overview: false,
    selected: undefined,
    visiting: undefined,
    sites: ['carol'],
    stop: vi.fn(),
    leave: vi.fn(),
    visit: vi.fn(() => true),
    jumpTo: vi.fn(),
    walkTo: vi.fn(),
    claimNextDoor: vi.fn(),
    walkToOpenPlot: vi.fn(),
    clearSelection: vi.fn(),
    setMe: vi.fn(),
    setPending: vi.fn(),
    nearest: () => [],
    toggleOverview: () => (map.overview = !map.overview),
  };
  return map;
}

/** Every map started, newest last. */
export const maps: ReturnType<typeof fakeMap>[] = [];
export const mapModule = {
  startMap: (
    _frame: HTMLElement,
    _canvas: HTMLCanvasElement,
    _prompt: unknown,
    options: MapOptions,
  ) => {
    const map = fakeMap(options);
    maps.push(map);
    return map;
  },
};

/** Every panel opened over the map, newest last: a square's, the factory's numbers or the advent calendar. */
export const huds: { kind: string; options: Record<string, unknown>; close: () => void }[] = [];
const openHud = (kind: string) => (_frame: HTMLElement, options: Record<string, unknown>) => {
  const hud = { kind, options, close: vi.fn() };
  huds.push(hud);
  return hud;
};
export const visitModule = { openVisitHud: openHud('visit') };
export const factoryModule = { openFactoryHud: openHud('factory') };
export const adventModule = { openAdventHud: openHud('advent') };

/** The Booths panel, as the map page starts it. */
export const panels: {
  options: Record<string, unknown>;
  showSelected: () => void;
  setMe: () => void;
  stop: () => void;
}[] = [];
export const boothsHudModule = {
  startBoothsPanel: (
    _panel: HTMLElement,
    _map: unknown,
    _canvas: unknown,
    options: Record<string, unknown>,
  ) => {
    const panel = { options, showSelected: vi.fn(), setMe: vi.fn(), stop: vi.fn() };
    panels.push(panel);
    return panel;
  },
};

/** The booths being built, as the map page follows them. */
export const pending = {
  show: undefined as ((booths: never[]) => void) | undefined,
  stop: vi.fn(),
  saved: [] as string[][],
};
export const pendingModule = {
  followPending: (show: (booths: never[]) => void) => {
    pending.show = show;
    return pending.stop;
  },
  knownPending: () => undefined,
  loadSites: () => [],
  saveSites: (logins: string[]) => {
    pending.saved.push(logins);
  },
};

/** Forgets every map, panel and pending booth the last test started. */
export function resetFakes() {
  maps.length = 0;
  huds.length = 0;
  panels.length = 0;
  pending.show = undefined;
  pending.saved.length = 0;
}

/** A fresh page with nothing on screen yet, at `hash`, changed without a hash change event. */
export function newPage(hash = '#/'): Page {
  history.replaceState(null, '', hash);
  const app = document.createElement('main');
  document.body.replaceChildren(app);
  return {
    app,
    avatars: new Set(['ana']),
    stop: undefined,
    map: undefined,
    panel: undefined,
    card: undefined,
    shown: undefined,
    cardFromHistory: false,
    ignoreNextRoute: false,
    invite: undefined,
  };
}

/** The map started last, or a failed test saying there's none. */
export function lastMap() {
  const map = maps.at(-1);
  if (!map) throw new Error('No map started');
  return map;
}

/** The panel opened last over the map, or a failed test saying there's none. */
export function lastHud() {
  const hud = huds.at(-1);
  if (!hud) throw new Error('No panel opened');
  return hud;
}
