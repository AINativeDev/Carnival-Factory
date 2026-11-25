/**
 * The Hot Cocoa Stand's words: a chalkboard on the snow counting the cups
 * served since the stand opened, and a line over the stand saying what to do next.
 */
import { box, iso } from '../../../src/northpole/diorama';
import { canvasFont, theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** Writes `text` centred on (x, y), `height` units tall and at most `width` wide, in `color`. */
function write(
  ctx: CanvasRenderingContext2D,
  text: string,
  at: { x: number; y: number },
  height: number,
  width: number,
  color: string,
) {
  ctx.save();
  ctx.font = canvasFont('title', 'bold');
  const k = height / theme.font.title;
  ctx.translate(at.x, at.y);
  ctx.scale(k, k);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.cocoa;
  ctx.fillText(text, 1.5, 1.5, width / k);
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0, width / k);
  ctx.restore();
}

/** Where the chalkboard stands on the snow: `w` along gx, its face at gy, `h` high from `lift`. */
const BOARD = { gx: -21, gy: 15, w: 14, h: 10, lift: 3 };

/** The chalkboard on two legs in front of the stand, counting the cups served since the stand opened. */
export function drawBoard(ctx: CanvasRenderingContext2D, served: number) {
  const { gx, gy, w, h, lift } = BOARD;
  for (const leg of [gx + 1, gx + w - 2]) {
    box(ctx, leg, gy, 1, 1, lift, colors.wood, colors.wood, colors.cocoa);
  }
  box(ctx, gx, gy, w, 1, h, colors.wood, colors.gingerbread, colors.cocoa, lift);
  // The chalk face, skewed onto the board's front so its words lie flat on it.
  const corner = iso(gx, gy + 1, lift + h);
  ctx.save();
  ctx.transform(1, 0.5, 0, 1, corner.x, corner.y);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(1, 1, w - 2, h - 2);
  write(ctx, 'Cups served', { x: w / 2, y: 3.4 }, 2.4, w - 4, colors.cream);
  write(ctx, String(served), { x: w / 2, y: 6.8 }, 4, w - 4, colors.gold);
  ctx.restore();
}

/** The line over the stand that tells a visitor what to do next. */
export function drawHint(ctx: CanvasRenderingContext2D, text: string) {
  write(ctx, text, { x: 50, y: 9 }, 4.6, 90, colors.cream);
}
