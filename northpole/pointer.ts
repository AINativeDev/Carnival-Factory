/**
 * Where the pointer is inside a square, from where it is on the page. The map
 * draws each square through an affine transform onto a stall's or a pavilion's
 * front, and a square's own page draws it scaled into a rectangle, so the
 * pointer goes back through the same transform. Plain functions, so the maths
 * is tested without a browser.
 */
import type { Mapping } from './render';
import type { SquarePointer } from './square';
import type { Tile } from './world';

/** How far, in CSS pixels, a press may move before letting go and still count as a click. */
export const TAP_SLOP = 8;

/**
 * Where a world point falls on a square `size` across that is drawn through
 * `mapping`, in the square's own coordinates, or undefined when it's outside
 * the square. This inverts the transform `paint` draws with: a point is
 * `origin + u * x / size + v * y / size`.
 */
export function onMapping(
  point: Tile,
  { origin, u, v }: Mapping,
  size: number,
): { x: number; y: number } | undefined {
  const det = u.x * v.y - u.y * v.x;
  if (Math.abs(det) < 1e-9) return undefined;
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const along = (dx * v.y - dy * v.x) / det;
  const down = (u.x * dy - u.y * dx) / det;
  if (along < 0 || along > 1 || down < 0 || down > 1) return undefined;
  return { x: along * size, y: down * size };
}

/**
 * Where a point falls on a square `size` across drawn scaled into `rect`, such
 * as a canvas on the page, or undefined when it's outside it.
 */
export function onRect(
  point: Tile,
  rect: { x: number; y: number; w: number; h: number },
  size: number,
): { x: number; y: number } | undefined {
  if (rect.w <= 0 || rect.h <= 0) return undefined;
  const x = ((point.x - rect.x) / rect.w) * size;
  const y = ((point.y - rect.y) / rect.h) * size;
  if (x < 0 || x > size || y < 0 || y > size) return undefined;
  return { x, y };
}

/**
 * The same pointer for the square drawn at another size, kept within
 * `0..to`, since the frame drops a pointer that rounding has put just outside.
 */
export function rescale(pointer: SquarePointer, from: number, to: number): SquarePointer {
  const fit = (value: number) => Math.min(to, Math.max(0, (value * to) / from));
  return { x: fit(pointer.x), y: fit(pointer.y), down: pointer.down };
}

/**
 * The pointer to send a square with its next frame, when `owed` is a press it
 * wasn't sent because it was still drawing: `pointer`, pressed, or the press
 * itself when the pointer has gone since. So a quick tap always reaches it.
 */
export function withOwedPress(
  pointer: SquarePointer | undefined,
  owed: SquarePointer | undefined,
): SquarePointer | undefined {
  if (!owed) return pointer;
  return pointer ? { ...pointer, down: true } : owed;
}

/** Whether a press at `from` let go at `to` is a click, not a drag. */
export function isTap(from: Tile, to: Tile, slop = TAP_SLOP): boolean {
  return Math.hypot(to.x - from.x, to.y - from.y) <= slop;
}
