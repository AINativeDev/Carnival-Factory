import { describe, expect, it } from 'vitest';
import { worldToScreen } from './camera-view';
import { framing, frameCentre, islandBounds } from './camera';
import { restingFocus } from './camera-focus';
import { toScreen, type Spot } from './world';
import { buildWorld } from './world-build';
import { ATTRACTIONS, booths } from '../test-support/sample-squares';

const world = buildWorld(ATTRACTIONS, booths(12));

describe('the resting view on a laptop', () => {
  it('keeps the player and their nearest free spot, sign and all, on screen', () => {
    const { zoom, target } = framing(world, 1400, 856, world.start, 0, false);
    const centre = frameCentre(islandBounds(world), 1400, 856, zoom, target);
    const mark = world.spots
      .filter((spot) => spot.kind === 'open')
      .sort(
        (a, b) =>
          Math.hypot(a.x - world.start.x, a.y - world.start.y) -
          Math.hypot(b.x - world.start.x, b.y - world.start.y),
      )
      .at(0);
    expect(mark).toBeDefined();
    for (const tile of [world.start, mark?.door ?? world.start]) {
      const at = worldToScreen(toScreen(tile), 1400, 856, centre, zoom);
      expect(at.x).toBeGreaterThan(0);
      expect(at.x).toBeLessThan(1400);
      expect(at.y).toBeGreaterThan(0);
      expect(at.y).toBeLessThan(856);
    }
  });

  it('frames the player alone where there is no free spot', () => {
    const full = { ...world, spots: world.spots.filter((spot) => spot.kind !== 'open') };
    const focus = restingFocus(full, world.start);
    const at = toScreen(world.start);
    expect(focus).toEqual({ x: at.x - 48, y: at.y - 120, w: 96, h: 150 });
  });
});

describe('the free spot the resting view keeps in sight', () => {
  const spot = (kind: Spot['kind'], x: number): Spot => ({
    kind,
    x,
    y: 0,
    w: 2,
    h: 2,
    number: 0,
    door: { x: x + 2, y: 0 },
  });
  const focusWith = (spots: Spot[], player = { x: 0, y: 0 }) =>
    restingFocus({ ...world, spots }, player);

  it('is the nearest free one, with room above it for its sign', () => {
    const focus = focusWith([spot('open', 10), spot('booth', 1), spot('open', -3)]);
    expect(focus).toEqual({ x: -160, y: -214, w: 208, h: 244 });
  });

  it('is the first of two free spots just as near', () => {
    expect(focusWith([spot('open', -3), spot('open', 3)])).toEqual(focusWith([spot('open', -3)]));
    expect(focusWith([spot('open', 3), spot('open', -3)])).toEqual(focusWith([spot('open', 3)]));
    expect(focusWith([spot('open', 3)])).not.toEqual(focusWith([spot('open', -3)]));
  });

  it('measures how near from where the player stands, both ways', () => {
    const above = { ...spot('open', 0), y: -4 };
    const below = { ...spot('open', 0), y: 5 };
    const player = { x: 0, y: 2 };
    expect(focusWith([above, below], player)).toEqual(focusWith([below], player));
    const right = spot('open', 4);
    const left = spot('open', -1);
    expect(focusWith([left, right], { x: 3, y: 0 })).toEqual(focusWith([right], { x: 3, y: 0 }));
  });
});
