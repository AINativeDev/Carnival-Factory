/**
 * The front every stall shape shares: the framed drawing with the name board
 * over it, the counter standing out before it, and the market stall's striped
 * awning. Each shape in `stall-shapes.ts` and `stall-cabin.ts` puts these on
 * its own walls.
 */
import { block, quad } from './brushes';
import { band, onFace, paintOnFace, type Face, type PaintSquare } from './faces';
import { faceSign, type Owner } from './name-board';
import type { NorthPoleSquare } from './square';
import { STALL, stallSignLow } from './stall-plan';
import { theme } from './theme';
import type { Box, Plot } from './world';

const { colors } = theme;

/** The front of a stall: a frame round the drawing, the drawing itself, and the name board over it. */
export function stallFront(
  ctx: CanvasRenderingContext2D,
  face: Face,
  square: NorthPoleSquare,
  paint: PaintSquare,
  owner: Owner,
) {
  const width = Math.abs(face.b.x - face.a.x);
  const art = width * 0.84;
  ctx.fillStyle = colors.cocoa;
  band(ctx, face, 0.05, 0.95, STALL.art - 3, STALL.art + art + 3);
  ctx.fill();
  paintOnFace(paint, square, face, 0.08, 0.92, STALL.art);
  const signLow = stallSignLow(face);
  faceSign(
    ctx,
    face,
    signLow,
    STALL.wall - 2,
    square.name,
    owner.by ?? `by @${square.id}`,
    0,
    owner,
  );
}

/** The counter, standing out in front of the drawing. */
export function stallCounter(ctx: CanvasRenderingContext2D, plot: Plot, face: Face) {
  const counter: Box =
    face.out.x > 0
      ? { x: plot.x + plot.w, y: plot.y, w: 0.3, h: plot.h }
      : { x: plot.x, y: plot.y + plot.h, w: plot.w, h: 0.3 };
  block(ctx, counter, STALL.counter, colors.gingerbread, colors.wood, colors.cocoa);
}

/** The market stall's awning, striped, sloping out over the counter, with a scalloped edge and snow on top. */
export function awning(ctx: CanvasRenderingContext2D, face: Face, roof: string, trim: string) {
  const width = Math.abs(face.b.x - face.a.x);
  const stripes = 8;
  for (let n = 0; n < stripes; n++) {
    ctx.fillStyle = n % 2 ? trim : roof;
    quad(ctx, [
      onFace(face, n / stripes, STALL.wall + 22, -0.5),
      onFace(face, (n + 1) / stripes, STALL.wall + 22, -0.5),
      onFace(face, (n + 1) / stripes, STALL.wall - 4, 0.45),
      onFace(face, n / stripes, STALL.wall - 4, 0.45),
    ]);
    ctx.fill();
    const scallop = onFace(face, (n + 0.5) / stripes, STALL.wall - 4, 0.45);
    ctx.beginPath();
    ctx.ellipse(scallop.x, scallop.y, width / stripes / 2, 4, 0, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = colors.snow;
  band(ctx, face, -0.02, 1.02, STALL.wall + 20, STALL.wall + 25, -0.5);
  ctx.fill();
}
