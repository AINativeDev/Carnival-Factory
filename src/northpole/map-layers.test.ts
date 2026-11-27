// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startHarness, type MapHarness } from '../test-support/map-harness';
import { levelOptions, northPoleOptions } from '../test-support/map-fixtures';
import { framing, islandCorners } from './camera';
import { layer } from './map-layers';
import { islandBox, layWorld } from './map-plan';

let map: MapHarness | undefined;
afterEach(() => {
  map?.stop();
  map = undefined;
  vi.restoreAllMocks();
});

describe("a still layer's canvas", () => {
  it('is whole pixels, rounded up, and never less than one', () => {
    const sizes = [layer(10.2, 5), layer(0.2, 0), layer(-3, 7.9)].map(({ canvas }) => [
      canvas.width,
      canvas.height,
    ]);
    expect(sizes).toEqual([
      [11, 5],
      [1, 1],
      [1, 8],
    ]);
  });
});

describe("the map's still layers", () => {
  /** Every canvas the map copies onto the screen in a frame, by its size. */
  const copied = (running: MapHarness) =>
    running
      .step(0)
      .filter(([name]) => name === 'drawImage')
      .map(([, what]) => String(what))
      .filter((what) => what.startsWith('canvas'));

  it('fit the screen at two device pixels a point at most', () => {
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(3);
    map = startHarness(northPoleOptions([]), { width: 300, height: 200, reduced: true });
    expect([map.canvas.width, map.canvas.height]).toEqual([600, 400]);
    expect(copied(map).slice(0, 2)).toEqual(['canvas 600x400', 'canvas 600x400']);
  });

  it('draw the island at the nearest the camera comes, at most 4096 pixels across', () => {
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(1.5);
    map = startHarness(levelOptions([]), { width: 301, height: 201, reduced: true });
    expect([map.canvas.width, map.canvas.height]).toEqual([452, 302]);
    const world = layWorld(levelOptions([]), []);
    const box = islandBox(islandCorners(world), world.indoor);
    const nearest = framing(world, 301, 201, world.start, 1, false).zoom * 1.5;
    const resolution = Math.min(nearest, 4096 / box.w, 4096 / box.h);
    const island = `canvas ${String(Math.ceil(box.w * resolution))}x${String(Math.ceil(box.h * resolution))}`;
    // The sky, the mountains, the island's ground, and its front fence last of all.
    const drawn = copied(map);
    expect(drawn.slice(0, 3)).toEqual(['canvas 452x302', 'canvas 452x302', island]);
    expect(drawn.at(-1)).toBe(island);
  });
});
