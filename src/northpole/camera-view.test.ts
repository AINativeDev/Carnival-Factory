import { describe, expect, it } from 'vitest';
import { fitZoom, frameCentre, islandBounds, PHONE_ZOOM } from './camera';
import {
  dragCentre,
  MAX_PINCH_ZOOM,
  pinchCentre,
  pinchZoom,
  screenToWorld,
  worldToScreen,
} from './camera-view';
import { buildWorld } from './world-build';
import { ATTRACTIONS, booths } from '../test-support/sample-squares';

const world = buildWorld(ATTRACTIONS, booths(3));

describe('turning viewport points into the world', () => {
  it('turns a point on screen into the world and back', () => {
    const centre = { x: 120, y: -40 };
    const point = { x: 300, y: 500 };
    const there = screenToWorld(point, 1280, 800, centre, 0.4);
    expect(worldToScreen(there, 1280, 800, centre, 0.4)).toEqual(point);
    expect(screenToWorld({ x: 640, y: 400 }, 1280, 800, centre, 0.4)).toEqual(centre);
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
