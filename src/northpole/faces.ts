/**
 * The faces of the things standing on the map: which side of a spot faces us,
 * points on it, strips across it, text along it the way a shop sign follows its
 * wall, and where a square's drawing goes on it. Stalls, pavilions, towers and
 * the entrance all hang their signs and drawings through these, so they live
 * apart from any one of them.
 */
import { corners, quad } from './brushes';
import type { NorthPoleSquare } from './square';
import { TILE_H, TILE_W, type Box, type Tile } from './world';

/** One of a spot's faces we see: its ends on the ground, left to right on screen, and a tile's step outwards. */
export interface Face {
  a: Tile;
  b: Tile;
  out: Tile;
}

/** The face a spot's drawing goes on: its door's, or with the door round the back, the one we see on that side. */
export function faceOf(spot: Box & { door: Tile }): Face {
  const c = corners(spot);
  const sideways = spot.door.x >= spot.x + spot.w || spot.door.x < spot.x;
  return sideways
    ? { a: c.bottom, b: c.right, out: { x: TILE_W / 2, y: TILE_H / 2 } }
    : { a: c.left, b: c.bottom, out: { x: -TILE_W / 2, y: TILE_H / 2 } };
}

/** The point `along` the way across a face, `lift` up it and `outward` tiles out from it. */
export function onFace(face: Face, along: number, lift: number, outward = 0): Tile {
  return {
    x: face.a.x + (face.b.x - face.a.x) * along + face.out.x * outward,
    y: face.a.y + (face.b.y - face.a.y) * along + face.out.y * outward - lift,
  };
}

/** A strip of a face from `from` to `to` across it, `low` to `high` up it, `outward` tiles out. */
export function band(
  ctx: CanvasRenderingContext2D,
  face: Face,
  from: number,
  to: number,
  low: number,
  high: number,
  outward = 0,
) {
  quad(ctx, [
    onFace(face, from, high, outward),
    onFace(face, to, high, outward),
    onFace(face, to, low, outward),
    onFace(face, from, low, outward),
  ]);
}

/**
 * Where a square's drawing goes on a face: a parallelogram whose top edge runs
 * along the face and whose sides stand upright. `u` and `v` are its top and
 * left edges from `origin`, its top-left corner.
 */
export interface Mapping {
  origin: Tile;
  u: Tile;
  v: Tile;
}

/** What draws a square onto a face of the world: the map's own `drawSquare`, through an affine transform. */
export type PaintSquare = (square: NorthPoleSquare, mapping: Mapping) => void;

/** The smallest a sign's text shrinks to before it's shortened instead. */
const MIN_TEXT_SCALE = 0.8;

/** Paints text along a face, the way a shop sign follows its wall, centred on `along` at height `lift`. */
export function faceText(
  ctx: CanvasRenderingContext2D,
  face: Face,
  text: string,
  along: number,
  lift: number,
  width: number,
  font: string,
  color: string,
  outward = 0,
) {
  const at = onFace(face, along, lift, outward);
  const slope = (face.b.y - face.a.y) / (face.b.x - face.a.x);
  ctx.save();
  ctx.transform(1, slope, 0, 1, at.x, at.y);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  // A long name shrinks a little, then is shortened with an ellipsis: its tag shows it whole.
  let shown = text;
  const fit = Math.max(MIN_TEXT_SCALE, Math.min(1, width / ctx.measureText(text).width));
  const chars = Array.from(text);
  while (chars.length > 1 && ctx.measureText(shown).width * fit > width) {
    chars.pop();
    shown = `${chars.join('').trimEnd()}…`;
  }
  ctx.scale(fit, fit);
  ctx.fillText(shown, 0, 0);
  ctx.restore();
}

/** Maps a square onto a face, from `from` to `to` across it and `low` up it, as tall as it is wide on screen. */
export function paintOnFace(
  paint: PaintSquare,
  square: NorthPoleSquare,
  face: Face,
  from: number,
  to: number,
  low: number,
  outward = 0,
) {
  const left = onFace(face, from, 0, outward);
  const right = onFace(face, to, 0, outward);
  const tall = Math.abs(right.x - left.x);
  paint(square, {
    origin: { x: left.x, y: left.y - low - tall },
    u: { x: right.x - left.x, y: right.y - left.y },
    v: { x: 0, y: tall },
  });
}
