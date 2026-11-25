/**
 * Helpers for drawing a square as a small diorama at dusk, the way the world
 * draws itself: a slab of snowy ground seen from the world's isometric angle,
 * lit from the upper left, with warm lights and cool shadows. See docs/style.md.
 *
 * Everything here works in the square's own 0 to 100 units: `scene` scales the
 * context to the square's size before it calls `paint`, so a square drawn with
 * these reads the same on the map and on its visit card.
 *
 * A square may import only this file of the diorama (lint/house-rules.js), so
 * it gathers the parts kept in the `diorama-*.ts` files beside it: the ground
 * and its boxes, the backdrop, the round shapes and the small touches. Every
 * booth may import them, so they import nothing but `./theme` and each other:
 * an import of anything else would hand every booth that part of the map too.
 * `diorama.test.ts` fails if they do.
 */
import { backdropAndSlab } from './diorama-backdrop';

export { backdrop } from './diorama-backdrop';
export { box, iso, type Point } from './diorama-ground';
export { arcSteps, cone, drum } from './diorama-round';
export { glow, pine, shadow, stringLights } from './diorama-touches';

/**
 * Draws a square's diorama: scales the context to 0 to 100 units, paints the
 * backdrop and the slab, then `paint` with the context still scaled.
 */
export function scene(
  ctx: CanvasRenderingContext2D,
  size: number,
  time: number,
  paint: (ctx: CanvasRenderingContext2D, time: number) => void,
) {
  ctx.save();
  ctx.scale(size / 100, size / 100);
  backdropAndSlab(ctx, size);
  paint(ctx, time);
  ctx.restore();
}
