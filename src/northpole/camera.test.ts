import { describe, expect, it } from 'vitest';
import {
  alongEdge,
  carnivalBounds,
  CARNIVAL_MARGIN,
  dragCentre,
  duskAt,
  fitZoom,
  frameCentre,
  framing,
  islandBounds,
  islandCorners,
  isPhone,
  MARGIN,
  MAX_PINCH_ZOOM,
  PHONE_ZOOM,
  pinchCentre,
  pinchZoom,
  screenToWorld,
  WALK_ZOOM,
  worldToScreen,
} from './camera';
import { faceOf, onFace } from './render';
import { buildWorld, toScreen } from './world';

const ATTRACTIONS = ['big-top', 'cocoa-stand', 'ferris-wheel', 'frozen-pond', 'sleigh-coaster'];
const booths = (count: number) => Array.from({ length: count }, (_, n) => `elf-${n}`);
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
    for (let n = 1; n < points.length; n++)
      expect(
        Math.hypot(points[n].x - points[n - 1].x, points[n].y - points[n - 1].y),
      ).toBeLessThanOrEqual(24);
  });

  it('has an entrance arch at the front, over the main path, where the player starts', () => {
    const arch = world.things.find((t) => t.kind === 'arch')!;
    expect(arch.x).toBe(world.extent - 1);
    expect(world.start).toEqual({ x: world.extent - 2, y: 0 });
    expect(world.ground.get(`${arch.x},0`)).toBe('path');
    expect(arch.blocks).toBe(false);
  });
});

describe('framing', () => {
  const bounds = islandBounds(world);

  it('fills a laptop with the carnival, every plot in view, when the player stands still', () => {
    const { zoom, target } = framing(world, 1400, 856, world.start, 0, false);
    const carnival = carnivalBounds(world);
    expect(zoom).toBeCloseTo(fitZoom(carnival, 1400, 856, CARNIVAL_MARGIN));
    // Twice as near as the whole island, or more.
    expect(zoom).toBeGreaterThan(2 * fitZoom(bounds, 1400, 856));
    const centre = frameCentre(bounds, 1400, 856, zoom, target);
    for (const plot of world.plots) {
      const at = worldToScreen(toScreen(plot.door), 1400, 856, centre, zoom);
      expect(at.x).toBeGreaterThan(0);
      expect(at.x).toBeLessThan(1400);
      expect(at.y).toBeGreaterThan(0);
      expect(at.y).toBeLessThan(856);
    }
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

  it('turns a point on screen into the world and back', () => {
    const centre = { x: 120, y: -40 };
    const point = { x: 300, y: 500 };
    const there = screenToWorld(point, 1280, 800, centre, 0.4);
    expect(worldToScreen(there, 1280, 800, centre, 0.4)).toEqual(point);
    expect(screenToWorld({ x: 640, y: 400 }, 1280, 800, centre, 0.4)).toEqual(centre);
  });

  it('darkens the dusk a little over a few minutes, and lightens it again', () => {
    expect(duskAt(0)).toBe(0);
    expect(duskAt(120_000)).toBeCloseTo(1);
    expect(duskAt(240_000)).toBeCloseTo(0);
  });
});

describe('dragging the map', () => {
  const bounds = islandBounds(world);
  const zoom = PHONE_ZOOM;
  const centre = frameCentre(bounds, 390, 844, zoom, { x: 0, y: 0 });

  it('moves the island with the finger', () => {
    const at = { x: 200, y: 400 };
    const moved = dragCentre(bounds, 390, 844, zoom, centre, at, { x: 230, y: 380 });
    const before = screenToWorld(at, 390, 844, centre, zoom);
    const after = worldToScreen(before, 390, 844, moved, zoom);
    expect(after.x).toBeCloseTo(230);
    expect(after.y).toBeCloseTo(380);
  });

  it('stops at the edge of the island', () => {
    const far = dragCentre(bounds, 390, 844, zoom, centre, { x: 0, y: 0 }, { x: 99999, y: 99999 });
    expect(far.x).toBeCloseTo(bounds.x + 390 / zoom / 2);
    expect(far.y).toBeCloseTo(bounds.y + 844 / zoom / 2);
  });
});

describe('fronts', () => {
  it('maps each square onto the face we see on its door side', () => {
    for (const plot of world.plots) {
      const face = faceOf(plot);
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

describe('pinching the map', () => {
  const bounds = islandBounds(world);
  const fit = fitZoom(bounds, 390, 844);
  const zoom = PHONE_ZOOM;
  const centre = frameCentre(bounds, 390, 844, zoom, { x: 0, y: 0 });

  it('comes nearer as the fingers spread, and goes farther as they close', () => {
    expect(pinchZoom(zoom, 100, 150, fit)).toBeCloseTo(zoom * 1.5);
    expect(pinchZoom(zoom, 150, 100, fit)).toBeCloseTo(zoom / 1.5);
  });

  it('stops at the whole island and at the nearest the camera comes', () => {
    expect(pinchZoom(zoom, 100, 1, fit)).toBe(fit);
    expect(pinchZoom(zoom, 1, 100, fit)).toBe(MAX_PINCH_ZOOM);
  });

  it('keeps what was between the fingers under them', () => {
    const from = { x: 180, y: 420 };
    const to = { x: 200, y: 400 };
    const next = pinchZoom(zoom, 100, 140, fit);
    const moved = pinchCentre(bounds, 390, 844, zoom, next, centre, from, to);
    const held = screenToWorld(from, 390, 844, centre, zoom);
    const after = worldToScreen(held, 390, 844, moved, next);
    expect(after.x).toBeCloseTo(to.x);
    expect(after.y).toBeCloseTo(to.y);
  });
});
