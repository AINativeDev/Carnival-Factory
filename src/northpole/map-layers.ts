/**
 * The map's still layers, drawn once and copied onto it every frame: the sky
 * and the mountains at the screen's size, and the island and its front fence
 * at the resolution the camera comes nearest at. Kept apart because they are
 * redrawn only when the window or the world changes, never frame by frame.
 */
import { framing, SLAB } from './camera';
import type { Layer, MapRun } from './map-state';
import { drawFrontFence, drawIsland, drawMountains, drawSky, setSpriteResolution } from './render';

/** The widest or tallest the island's cached layers get, in device pixels. */
const LAYER_MAX = 4096;

/** A canvas of its own, to draw a layer on once. */
export function layer(width: number, height: number): Layer {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  return { canvas, ctx: canvas.getContext('2d') as CanvasRenderingContext2D };
}

/** Sizes the canvas to the frame and the device's pixels, and draws the still layers again. */
export function resize(m: MapRun) {
  m.scale = Math.min(2, window.devicePixelRatio || 1);
  const width = m.frame.clientWidth;
  const height = m.frame.clientHeight;
  m.canvas.width = Math.round(width * m.scale);
  m.canvas.height = Math.round(height * m.scale);
  const sky = layer(m.canvas.width, m.canvas.height);
  m.layers.sky = sky;
  sky.ctx.scale(m.scale, m.scale);
  drawSky(sky.ctx, width, height);
  const mountains = layer(m.canvas.width, m.canvas.height);
  m.layers.mountains = mountains;
  mountains.ctx.scale(m.scale, m.scale);
  drawMountains(mountains.ctx, width, height);
  // The nearest the camera comes, walking on a laptop or following on a phone.
  const nearest = framing(m.world, width, height, m.player, 1, false).zoom;
  const box = m.groundBox;
  const resolution = Math.min(nearest * m.scale, LAYER_MAX / box.w, LAYER_MAX / box.h);
  const island = (draw: (ctx: CanvasRenderingContext2D) => void) => {
    const made = layer(box.w * resolution, box.h * resolution);
    made.ctx.setTransform(resolution, 0, 0, resolution, -box.x * resolution, -box.y * resolution);
    draw(made.ctx);
    return made;
  };
  m.layers.ground = island((ctx) => {
    drawIsland(ctx, m.world, m.island, SLAB);
  });
  m.layers.front = island((ctx) => {
    drawFrontFence(ctx, m.island);
  });
  setSpriteResolution(nearest * m.scale);
}
