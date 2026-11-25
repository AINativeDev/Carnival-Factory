/**
 * Reading where things are on the map's canvas, from the attributes the map
 * publishes for its tests: its camera, and the stage inside a square where the
 * square's drawing fills the back wall. Kept apart from the specs because the
 * pointer, the claim and the play tests all aim at the same places.
 */
import type { Locator } from '@playwright/test';
import type { Page } from '../coverage';
import { present } from './carnival';

/** The canvas's box on the page. */
export async function boxOf(canvas: Locator) {
  return present(await canvas.boundingBox(), 'box for the map canvas');
}

/** Where the map's camera looks, and its zoom, as `data-camera` says. */
export function cameraFrom(camera: string) {
  const [x = NaN, y = NaN, zoom = NaN] = camera.split(',').map(Number);
  return { x, y, zoom };
}

/** Where the map's camera looks now. */
export async function cameraOf(canvas: Locator) {
  return cameraFrom(present(await canvas.getAttribute('data-camera'), 'camera on the map'));
}

/**
 * The stage inside a square, where its drawing fills the back wall, in the
 * page's own pixels: `data-stage` is in the canvas's device pixels.
 */
export async function stageOf(page: Page) {
  const canvas = page.locator('.map-canvas');
  const stage = present(await canvas.getAttribute('data-stage'), 'stage inside the square');
  const [x = NaN, y = NaN, w = NaN, h = NaN] = stage.split(',').map(Number);
  const box = await boxOf(canvas);
  const ratio = await page.evaluate(() => Math.min(2, devicePixelRatio || 1));
  return { x: box.x + x / ratio, y: box.y + y / ratio, w: w / ratio, h: h / ratio };
}
