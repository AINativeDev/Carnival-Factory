import { assert, describe, expect, it } from 'vitest';
import {
  alongEdge,
  carnivalBounds,
  CARNIVAL_MARGIN,
  duskAt,
  fitZoom,
  frameCentre,
  framing,
  islandBounds,
  islandCorners,
  isPhone,
  MARGIN,
  PHONE_ZOOM,
  LAPTOP_CLOSER,
  WALK_ZOOM,
} from './camera';
import { worldToScreen } from './camera-view';
import { faceOf, onFace } from './faces';
import { toScreen } from './world';
import { buildWorld } from './world-build';
import { ATTRACTIONS, booths } from '../test-support/sample-squares';

const world = buildWorld(ATTRACTIONS, booths(3));

describe('the island', () => {
  it('has its corners at the outer edges of its outer tiles', () => {
    const c = islandCorners(world);
    expect(c.top).toEqual(toScreen({ x: -world.extent - 0.5, y: -world.extent - 0.5 }));
    expect(c.bottom).toEqual(toScreen({ x: world.extent + 0.5, y: world.extent + 0.5 }));
    expect(c.left.x).toBeLessThan(c.right.x);
    expect(c.top.y).toBeLessThan(c.bottom.y);
  });

  it('bounds every tile, and everything standing on the island', () => {
    const bounds = islandBounds(world);
    for (const thing of world.things) {
      const at = toScreen(thing);
      expect(at.x).toBeGreaterThan(bounds.x);
      expect(at.x).toBeLessThan(bounds.x + bounds.w);
      expect(at.y).toBeGreaterThan(bounds.y);
      expect(at.y).toBeLessThan(bounds.y + bounds.h);
    }
  });

  it('grows as booths are added, and still fits the same screen', () => {
    const big = buildWorld(ATTRACTIONS, booths(40));
    const small = islandBounds(world);
    const large = islandBounds(big);
    expect(large.w).toBeGreaterThan(small.w);
    const zoom = fitZoom(large, 1280, 800);
    expect(large.w * zoom).toBeLessThanOrEqual(1280 - 2 * MARGIN + 1e-9);
    expect(large.h * zoom).toBeLessThanOrEqual(800 - 2 * MARGIN + 1e-9);
    expect(zoom).toBeLessThan(fitZoom(small, 1280, 800));
  });

  it('puts fence posts along an edge, both ends included, no further apart than asked', () => {
    const points = alongEdge({ x: 0, y: 0 }, { x: 100, y: 50 }, 24);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points.at(-1)).toEqual({ x: 100, y: 50 });
    points.reduce((before, point) => {
      expect(Math.hypot(point.x - before.x, point.y - before.y)).toBeLessThanOrEqual(24);
      return point;
    });
  });

  it('has an entrance arch at the front, over the main path, where the player starts', () => {
    const arch = world.things.find((t) => t.kind === 'arch');
    assert(arch);
    expect(arch.x).toBe(world.extent - 1);
    expect(world.start).toEqual({ x: world.extent - 2, y: 0 });
    expect(world.ground.get(`${arch.x},0`)).toBe('path');
    expect(arch.blocks).toBe(false);
  });
});

describe('framing', () => {
  const bounds = islandBounds(world);

  it('rests among the stalls on a laptop, nearer than the carnival fits, with the player in view', () => {
    const { zoom, target } = framing(world, 1400, 856, world.start, 0, false);
    const carnival = carnivalBounds(world);
    expect(zoom).toBeCloseTo(
      Math.min(1.25, fitZoom(carnival, 1400, 856, CARNIVAL_MARGIN) * LAPTOP_CLOSER),
    );
    expect(zoom).toBeGreaterThan(fitZoom(carnival, 1400, 856, CARNIVAL_MARGIN));
    const centre = frameCentre(bounds, 1400, 856, zoom, target);
    const at = worldToScreen(toScreen(world.start), 1400, 856, centre, zoom);
    expect(at.x).toBeGreaterThan(0);
    expect(at.x).toBeLessThan(1400);
    expect(at.y).toBeGreaterThan(0);
    expect(at.y).toBeLessThan(856);
  });

  it('keeps a player who wanders off into the forest in view', () => {
    const away = { x: -world.extent + 1, y: -world.extent + 1 };
    const { zoom, target } = framing(world, 1400, 856, away, 0, false);
    const centre = frameCentre(bounds, 1400, 856, zoom, target);
    const at = worldToScreen(toScreen(away), 1400, 856, centre, zoom);
    expect(at.y).toBeGreaterThan(0);
    expect(at.x).toBeGreaterThan(0);
  });

  it('frames a carnival with more booths a little further out', () => {
    const big = buildWorld(ATTRACTIONS, booths(40));
    expect(carnivalBounds(big).w).toBeGreaterThan(carnivalBounds(world).w);
    expect(framing(big, 1400, 856, big.start, 0, false).zoom).toBeLessThan(
      framing(world, 1400, 856, world.start, 0, false).zoom,
    );
  });

  it('shows the whole island, with room round it, when asked', () => {
    const { zoom, target } = framing(world, 1280, 800, world.start, 0, true);
    expect(zoom).toBe(fitZoom(bounds, 1280, 800));
    const centre = frameCentre(bounds, 1280, 800, zoom, target);
    const corner = worldToScreen(islandCorners(world).left, 1280, 800, centre, zoom);
    expect(corner.x).toBeGreaterThanOrEqual(MARGIN - 1e-9);
    expect(centre).toEqual({ x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 });
  });

  it('comes in a little as the player walks, and no further', () => {
    const still = framing(world, 1280, 800, world.start, 0, false).zoom;
    expect(framing(world, 1280, 800, world.start, 0.5, false).zoom).toBeCloseTo(
      still * (1 + WALK_ZOOM / 2),
    );
    expect(framing(world, 1280, 800, world.start, 5, false).zoom).toBeCloseTo(
      still * (1 + WALK_ZOOM),
    );
  });

  it('never looks past the island, however close in and wherever the player is', () => {
    const zoom = fitZoom(bounds, 1280, 800) * (1 + WALK_ZOOM);
    for (const at of [
      world.start,
      { x: world.extent, y: world.extent },
      { x: -world.extent, y: 0 },
    ]) {
      const centre = frameCentre(bounds, 1280, 800, zoom, toScreen(at));
      const halfW = 1280 / zoom / 2;
      const halfH = 800 / zoom / 2;
      expect(centre.x - halfW).toBeGreaterThanOrEqual(bounds.x - 1e-6);
      expect(centre.x + halfW).toBeLessThanOrEqual(bounds.x + bounds.w + 1e-6);
      expect(centre.y - halfH).toBeGreaterThanOrEqual(bounds.y - 1e-6);
      expect(centre.y + halfH).toBeLessThanOrEqual(bounds.y + bounds.h + 1e-6);
    }
  });

  it('follows the player close up on a phone, and shows the whole island when asked', () => {
    expect(isPhone(390)).toBe(true);
    expect(isPhone(1280)).toBe(false);
    const close = framing(world, 390, 800, world.start, 0, false);
    expect(close.zoom).toBe(PHONE_ZOOM);
    expect(close.target).toEqual(toScreen(world.start));
    expect(framing(world, 390, 800, world.start, 0, true).zoom).toBe(fitZoom(bounds, 390, 800));
  });

  it('darkens the dusk a little over a few minutes, and lightens it again', () => {
    expect(duskAt(0)).toBe(0);
    expect(duskAt(120_000)).toBeCloseTo(1);
    expect(duskAt(240_000)).toBeCloseTo(0);
  });
});

describe('fronts', () => {
  it('maps each square onto the face we see on its door side', () => {
    for (const spot of world.spots) {
      const face = faceOf(spot);
      // Left to right on screen, along the ground, stepping out towards the viewer.
      expect(face.a.x).toBeLessThan(face.b.x);
      expect(face.out.y).toBeGreaterThan(0);
      const middle = onFace(face, 0.5, 0, 0);
      const out = onFace(face, 0.5, 10, 1);
      expect(out.x - middle.x).toBe(face.out.x);
      expect(out.y - middle.y).toBe(face.out.y - 10);
    }
  });
});
