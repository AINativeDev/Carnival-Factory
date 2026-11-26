/**
 * An item to discover in an indoor level (ADR 0040): a level's square or an
 * attraction that asks for a display (`stall.display`) stands as a low plinth
 * with a cloth in its `roof` colour, its name on a gold plaque, and its
 * drawing on a framed card on top, facing the visitor, under a warm spot of
 * light. It's small, as an exhibit is, so a room holds several and the
 * visitor walks up to each one. Booths never get one: the map keeps them to
 * their stalls.
 */
import { block, glow, middle, shadow } from './brushes';
import { band, faceOf, onFace, paintOnFace, type PaintSquare } from './faces';
import { inset } from './furniture';
import { faceSign } from './name-board';
import { SIGN_STYLES } from './sign-styles';
import { standing } from './stall-plan';
import type { NorthPoleSquare } from './square';
import { theme } from './theme';
import type { Box, Spot } from './world';

const { colors } = theme;

/** How tall the plinth stands, and how far back on its top the card stands, in world pixels and tiles. */
const DISPLAY = { plinth: 26, back: 0.45 };

/** Draws an item on its plinth, and returns where a click opens it. */
export function drawDisplay(
  ctx: CanvasRenderingContext2D,
  spot: Spot,
  square: NorthPoleSquare,
  paint: PaintSquare,
): Box {
  const { x, y } = middle(spot);
  shadow(ctx, x, y + 6, 40);
  const plinth = inset(spot, 0.25);
  const cloth = colors[square.stall?.roof ?? 'gold'];
  block(ctx, plinth, DISPLAY.plinth, cloth, colors.wood, colors.cocoa);
  const face = faceOf({ ...plinth, door: spot.door });
  faceSign(ctx, face, 4, DISPLAY.plinth - 4, square.name, '', 0, undefined, SIGN_STYLES.kiosk);
  // The card on top: a gold frame, the square's drawing in it, and a prop behind holding it up.
  const card = Math.abs(face.b.x - face.a.x) * 0.84;
  const low = DISPLAY.plinth + 4;
  const top = onFace(face, 0.5, low + card + 6, -DISPLAY.back);
  glow(ctx, top.x, top.y - 6, 40, 0.8);
  ctx.fillStyle = colors.gold;
  band(ctx, face, 0.04, 0.96, DISPLAY.plinth, low + card + 4, -DISPLAY.back);
  ctx.fill();
  paintOnFace(paint, square, face, 0.08, 0.92, low, -DISPLAY.back);
  return standing(spot, low + card + 20);
}
