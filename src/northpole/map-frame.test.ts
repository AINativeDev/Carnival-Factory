// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startHarness, type MapHarness, type Screen } from '../test-support/map-harness';
import { key, point, screenAt } from '../test-support/map-events';
import { LEVEL, levelOptions, northPoleOptions, square } from '../test-support/map-fixtures';
import { levelWorld } from './level';
import { layWorld } from './map-plan';
import type { MapOptions } from './map-options';
import type { Spot } from './world';

let map: MapHarness | undefined;
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));
afterEach(() => {
  map?.stop();
  map = undefined;
  vi.restoreAllMocks();
});

const start = (options: MapOptions, screen?: Screen) => (map = startHarness(options, screen));
const frames = (running: MapHarness, from: number, to: number, every = 100) => {
  for (let t = from; t < to; t += every) running.step(t);
};

describe('a frame of the map', () => {
  it('times its frames for the smoke test once the page has warmed up', () => {
    const running = start(levelOptions([]));
    frames(running, 0, 100 * 16, 16);
    expect(running.canvas.dataset.frameMs).toBe('0.00');
  });

  it('points the way at the edge of the screen to a picked square out of view', () => {
    const options = northPoleOptions([]);
    const world = layWorld(options, []);
    const far = (spot: Spot) => Math.hypot(spot.x - world.start.x, spot.y - world.start.y);
    const squares = world.spots.filter(
      (spot) => spot.kind === 'booth' || spot.kind === 'attraction',
    );
    const farthest = squares.sort((a, b) => far(b) - far(a)).at(0);
    if (farthest?.kind !== 'booth' && farthest?.kind !== 'attraction') throw new Error('no square');
    const running = start(options, { width: 120, height: 120 });
    running.step(0);
    running.controls.walkTo(farthest.kind, String(farthest.id));
    const drawn = running.step(100);
    expect(drawn.some(([name]) => name === 'rotate')).toBe(true);
    expect(running.prompt.style.opacity).toBe('0');
  });

  it('keeps the crowd still for reduced motion, and has no skaters without a pond', () => {
    expect(start(northPoleOptions([]), { reduced: true }).step(0).length).toBeGreaterThan(0);
    map?.stop();
    const dry = { ...levelWorld(LEVEL), pond: { x: 0, y: 0, w: 0, h: 0 } };
    const options = levelOptions([]);
    const level = { id: 'dry', name: 'Dry', world: dry, tint: 'tint' };
    expect(start({ ...options, level }).step(0).length).toBeGreaterThan(0);
  });

  it('draws at one pixel a point when the screen says none', () => {
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(0);
    const running = start(levelOptions([]));
    expect(running.canvas.width).toBe(1200);
  });

  it('goes inside before it has drawn the map, and draws the map for a spot whose square is gone', () => {
    const running = start(levelOptions([]), { reduced: true });
    running.controls.visit('attraction', 'skates');
    running.step(0);
    expect(running.canvas.dataset.room).toBeDefined();
    map?.stop();
    const partial = start(levelOptions([], { attractions: [square('skates')] }), { reduced: true });
    partial.controls.visit('attraction', 'cocoa');
    partial.step(0);
    expect(partial.canvas.dataset.room).toBeUndefined();
  });

  it('sparkles a booth that replaced its construction site once, and not for reduced motion', () => {
    for (const reduced of [false, true]) {
      const options = northPoleOptions([], { wereSites: ['jedi4ever'] });
      const running = start({ ...options, focus: { kind: 'booth', id: 'jedi4ever' } }, { reduced });
      frames(running, 0, 400);
      expect(running.canvas.dataset.near).toBe('booth:jedi4ever');
      running.stop();
    }
    map = undefined;
  });
});

describe('the tags and footprints round the North Pole', () => {
  const options = northPoleOptions([]);
  const world = layWorld(options, []);
  const first = (kind: Spot['kind']) => world.spots.find((spot) => spot.kind === kind);

  it('names a platform and an open spot under the mouse', () => {
    const running = start(options);
    for (const kind of ['platform', 'open'] as const) {
      const spot = first(kind);
      if (!spot) throw new Error(`no ${kind} spot`);
      running.controls.walkTo('booth', 'jedi4ever');
      running.controls.jumpTo('booth', 'jedi4ever');
      frames(running, 0, 300);
      const centre = { x: spot.x + spot.w / 2, y: spot.y + spot.h / 2 };
      point(running, 'pointermove', screenAt(running, centre));
      running.step(400);
      expect(running.tag()?.dataset.spot).toMatch(new RegExp(`^${kind}:`));
    }
  });

  it('leaves footprints to the open spot being claimed, until the player goes elsewhere', () => {
    const running = start(options);
    running.controls.jumpTo('booth', 'dancer');
    running.step(0);
    running.controls.claimNextDoor();
    const drawn = [];
    for (let t = 100; t < 6000; t += 100) drawn.push(...running.step(t));
    key('keydown', 's');
    frames(running, 6000, 7000);
    key('keyup', 's');
    expect(drawn.filter(([name]) => name === 'ellipse').length).toBeGreaterThan(0);
  });
});
