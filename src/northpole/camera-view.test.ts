import { describe, expect, it } from 'vitest';
import { fitZoom, frameCentre, islandBounds, PHONE_ZOOM } from './camera';
import {
  dragCentre,
  MAX_PINCH_ZOOM,
  pinchCentre,
  pinchZoom,
  screenToWorld,
  wheelZoom,
  worldToScreen,
  ZOOM_STEP,
  zoomBy,
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

  it('stays put while the fingers have no distance between them yet', () => {
    expect(pinchZoom(zoom, 0, 100, fit)).toBe(zoom);
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

describe('zooming with the buttons, the keys and the wheel', () => {
  const fit = 0.3;

  it('steps nearer and farther', () => {
    expect(zoomBy(0.8, ZOOM_STEP, fit)).toBeCloseTo(0.8 * ZOOM_STEP);
    expect(zoomBy(0.8, 1 / ZOOM_STEP, fit)).toBeCloseTo(0.8 / ZOOM_STEP);
  });

  it('stops at the whole island and at the nearest the camera comes', () => {
    expect(zoomBy(0.32, 0.5, fit)).toBe(fit);
    expect(zoomBy(1.4, 2, fit)).toBe(MAX_PINCH_ZOOM);
  });

  it('never moves the wrong way from past a limit, as a walk can take the camera', () => {
    expect(zoomBy(1.7, ZOOM_STEP, fit)).toBe(1.7);
    expect(zoomBy(0.2, 1 / ZOOM_STEP, fit)).toBe(0.2);
  });

  it('turns the wheel down to farther, and up to nearer, a pinch on a trackpad faster', () => {
    expect(wheelZoom(100, 0, false, 800)).toBeLessThan(1);
    expect(wheelZoom(-100, 0, false, 800)).toBeGreaterThan(1);
    expect(wheelZoom(-10, 0, true, 800)).toBeLessThan(wheelZoom(-100, 0, false, 800));
    expect(wheelZoom(-10, 0, true, 800)).toBeGreaterThan(wheelZoom(-10, 0, false, 800));
  });

  it('reads the wheel in lines or pages as so many pixels, and never jumps more than double', () => {
    expect(wheelZoom(3, 1, false, 800)).toBeCloseTo(wheelZoom(48, 0, false, 800));
    expect(wheelZoom(1, 2, false, 800)).toBe(0.5);
    expect(wheelZoom(-9999, 0, false, 800)).toBe(2);
  });
});
