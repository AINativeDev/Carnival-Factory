/**
 * The hall's furniture, built from the diorama's lit volumes: a block (a
 * desk, a bench, a gatepost) placed by the front corner it stands on, a
 * round podium, a framed chalkboard and a pinned-up form on the wall, and a
 * flat mat on the floor. Lit from the upper left like the rest of the North
 * Pole: lit left faces, shaded right faces, cool shadows to the lower right.
 */
import { box, drum, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { rounded } from './kit';

const { colors } = theme;

/** A block's three faces: its top, its lit left side and its shaded right side. */
export interface Faces {
  top: string;
  left: string;
  right: string;
}

/** Wood in the lamplight. */
const WOOD: Faces = { top: colors.gingerbread, left: colors.wood, right: colors.cocoa };

/**
 * A block standing with its front corner on (`x`, `y`): `w` along to its
 * upper left, `d` along to its upper right, and `h` high, with its cool
 * shadow cast to the lower right.
 */
export function block(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: { w: number; d: number; h: number },
  faces: Faces = WOOD,
) {
  const { w, d, h } = size;
  shadow(ctx, x + (d - w) / 2 + 2, y - (w + d) / 4 + 1, (w + d) * 1.1);
  // The diorama's boxes stand on its own slab (centre 50, 66): this finds
  // the spot on it whose front corner falls on (x, y).
  const across = x - 50;
  const down = 2 * (y - 66);
  const gx = (across + down) / 2 - w;
  const gy = (down - across) / 2 - d;
  box(ctx, gx, gy, w, d, h, faces.top, faces.left, faces.right);
}

/** A round podium on (`x`, `y`), `rx` round, its top warm in the light. */
export function podium(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number) {
  shadow(ctx, x + 2, y + 1, rx * 2.4);
  drum(ctx, x, y, rx, 5, [colors.gingerbread, colors.wood], 6, 0.3, colors.lantern);
}

/** A framed chalkboard on the wall from `x`, with a chalk loop and a star on it. */
export function chalkboard(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - 1, 24, 24, 14);
  ctx.fillStyle = colors.pineDark;
  ctx.fillRect(x, 25, 22, 12);
  ctx.strokeStyle = colors.snow;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.ellipse(x + 9, 31, 5, 3.2, 0, 0.2, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 13.4, 28.3);
  ctx.lineTo(x + 14.2, 30.2);
  ctx.lineTo(x + 12, 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 18, 29.5, 1.1, 0, Math.PI * 2);
  ctx.moveTo(x + 16.5, 33.5);
  ctx.lineTo(x + 19.5, 33.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(x + 1, 37, 20, 0.9);
}

/** The Your booth form, pinned to the wall from `x`: a paper with a gold header and lines. */
export function form(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x + 0.8, 24.8, 15, 13);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.snowLit;
  ctx.fillRect(x, 24, 15, 13);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x + 1.5, 25.5, 12, 1.8);
  ctx.fillStyle = colors.slab;
  for (const [n, w] of [9, 11, 7, 10].entries()) ctx.fillRect(x + 1.5, 29 + n * 2, w, 0.7);
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.arc(x + 7.5, 24, 0.7, 0, Math.PI * 2);
  ctx.fill();
}

/** A flat mat on the floor, a diamond round (`x`, `y`), `rx` across each way, with a quiet grid. */
export function mat(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number) {
  const ry = rx / 3;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x - rx, y);
    ctx.lineTo(x, y - ry);
    ctx.lineTo(x + rx, y);
    ctx.lineTo(x, y + ry);
    ctx.closePath();
  };
  ctx.fillStyle = colors.slabShade;
  ctx.translate(0, 0.8);
  path();
  ctx.fill();
  ctx.translate(0, -0.8);
  ctx.fillStyle = colors.slab;
  path();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = colors.snowLit;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 0.25;
  ctx.beginPath();
  for (let n = -6; n <= 6; n++) {
    ctx.moveTo(x + n * (rx / 6) - rx, y - ry);
    ctx.lineTo(x + n * (rx / 6) + rx, y + ry);
    ctx.moveTo(x + n * (rx / 6) + rx, y - ry);
    ctx.lineTo(x + n * (rx / 6) - rx, y + ry);
  }
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** An ink pad on a desk: its dark case and the coloured pad in it. */
export function pad(ctx: CanvasRenderingContext2D, x: number, y: number, fill: string) {
  ctx.fillStyle = colors.ink;
  rounded(ctx, x - 3, y - 1.2, 6, 2.4, 0.8);
  ctx.fill();
  ctx.fillStyle = fill;
  rounded(ctx, x - 2.4, y - 1.4, 4.8, 1.6, 0.6);
  ctx.fill();
}
