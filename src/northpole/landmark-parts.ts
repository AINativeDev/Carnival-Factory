/**
 * The parts every landmark shares: the stage it stands on, and the board that
 * shows its square's own drawing under its name. Whatever shape a landmark
 * is, its drawing still hangs on it, framed in gold, because the map opens a
 * square's sandboxed frame only when it paints its drawing, and the smoke and
 * flashing checks play what it paints (ADR 0042).
 */
import { block, middle, shadow } from './brushes';
import { band, faceOf, paintOnFace, type Face, type PaintSquare } from './faces';
import { faceSign } from './name-board';
import { SIGN_STYLES, type SignStyle } from './sign-styles';
import type { NorthPoleSquare } from './square';
import { PAVILION } from './stall-plan';
import { theme } from './theme';
import type { Box, Spot, Tile } from './world';

const { colors } = theme;

/** How a landmark's drawing is drawn: the same as the map's own `drawSpot`, returning where a click opens it. */
export type LandmarkDrawer = (
  ctx: CanvasRenderingContext2D,
  spot: Spot,
  square: NorthPoleSquare,
  paint: PaintSquare,
  time: number,
) => Box;

/** A box `by` tiles in from each side of `box`. */
export const inset = (box: Box, by: number): Box => ({
  x: box.x + by,
  y: box.y + by,
  w: box.w - by * 2,
  h: box.h - by * 2,
});

/** The face of `box` on the side of `spot`'s door. */
export const frontOf = (spot: Spot, box: Box = spot): Face => faceOf({ ...box, door: spot.door });

/** The landmark's stage: a shadow on the snow and a low platform over its whole spot. Gives its middle. */
export function stage(ctx: CanvasRenderingContext2D, spot: Spot, spread = 80): Tile {
  const { x, y } = middle(spot);
  shadow(ctx, x, y + 8, spread);
  block(ctx, spot, PAVILION.stage, colors.snowShade, colors.surface, colors.night);
  return { x, y };
}

/**
 * Where the drawing goes on a face: from `from` to `to` across it, `low` up it
 * and `outward` tiles out, under a name board `board` high.
 */
export interface ArtPlace {
  from: number;
  to: number;
  low: number;
  outward?: number;
  board?: number;
}

/**
 * The square's drawing framed in gold on a face, with its name board over it
 * in `style`. Gives the height of the board's top, for what stands above it.
 */
export function framedArt(
  ctx: CanvasRenderingContext2D,
  face: Face,
  square: NorthPoleSquare,
  paint: PaintSquare,
  place: ArtPlace,
  style: SignStyle = SIGN_STYLES.pavilion,
): number {
  const { from, to, low, outward = 0, board = 24 } = place;
  const tall = Math.abs(face.b.x - face.a.x) * (to - from - 0.04);
  ctx.fillStyle = colors.gold;
  band(ctx, face, from, to, low - 4, low + tall + 4, outward);
  ctx.fill();
  paintOnFace(paint, square, face, from + 0.02, to - 0.02, low, outward);
  const top = low + tall + 6 + board;
  faceSign(ctx, face, low + tall + 6, top, square.name, '', outward, undefined, style);
  return top;
}

/**
 * A board standing on two posts at the front of the spot, for a landmark that
 * isn't a building to hang its drawing on: a wheel, a rink, a coaster.
 */
export function signPost(
  ctx: CanvasRenderingContext2D,
  spot: Spot,
  square: NorthPoleSquare,
  paint: PaintSquare,
  place: ArtPlace,
  style?: SignStyle,
): number {
  const face = frontOf(spot);
  ctx.fillStyle = colors.cocoa;
  for (const along of [place.from + 0.03, place.to - 0.03]) {
    band(ctx, face, along - 0.01, along + 0.01, 0, place.low, place.outward);
    ctx.fill();
  }
  return framedArt(ctx, face, square, paint, place, style);
}
