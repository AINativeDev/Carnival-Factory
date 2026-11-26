import { describe, expect, it } from 'vitest';
import { worldToScreen } from './camera-view';
import { framing, frameCentre, islandBounds } from './camera';
import { restingFocus } from './camera-focus';
import { toScreen } from './world';
import { buildWorld } from './world-build';
import { ATTRACTIONS, booths } from '../test-support/sample-squares';

const world = buildWorld(ATTRACTIONS, booths(12));

describe('the resting view on a laptop', () => {
  it('keeps the player and their nearest free spot, sign and all, on screen', () => {
    const { zoom, target } = framing(world, 1400, 856, world.start, 0, false);
    const centre = frameCentre(islandBounds(world), 1400, 856, zoom, target);
    const mark = world.plots
      .filter((plot) => plot.kind === 'open')
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
    const full = { ...world, plots: world.plots.filter((plot) => plot.kind !== 'open') };
    const focus = restingFocus(full, world.start);
    const at = toScreen(world.start);
    expect(focus).toEqual({ x: at.x - 48, y: at.y - 120, w: 96, h: 150 });
  });
});
