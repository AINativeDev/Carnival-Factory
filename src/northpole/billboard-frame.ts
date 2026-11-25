/**
 * The steel the AI DevCon billboard stands on, the way a billboard by a road
 * does: two tall legs braced with a cross, a catwalk with a railing under the
 * board, and spotlights on arms that lean over its top and light it at dusk.
 * Kept apart from billboard.ts, which says what the board reads and where it is.
 */
import { theme } from './theme';
import type { Box, Tile } from './world';

const { colors } = theme;

/** A steel beam from `a` to `b`, `width` wide. */
function beam(ctx: CanvasRenderingContext2D, a: Tile, b: Tile, width: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

/** The legs, braced with a cross between them, from the snow at `foot` up to the board's bottom edge. */
export function drawLegs(ctx: CanvasRenderingContext2D, foot: Tile, board: Box) {
  const bottom = board.y + board.h;
  const legs = [-0.28, 0.28].map((side) => foot.x + side * board.w);
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.ellipse(foot.x, foot.y, board.w * 0.42, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  const [left = foot.x, right = foot.x] = legs;
  const mid = (foot.y + bottom) / 2;
  beam(ctx, { x: left, y: mid }, { x: right, y: bottom + 6 }, 2, colors.shadow);
  beam(ctx, { x: left, y: bottom + 6 }, { x: right, y: mid }, 2, colors.shadow);
  beam(ctx, { x: left, y: foot.y - 18 }, { x: right, y: foot.y - 18 }, 2, colors.shadow);
  for (const x of legs) {
    beam(ctx, { x, y: foot.y }, { x, y: bottom }, 7, colors.ink);
    beam(ctx, { x: x - 2, y: foot.y }, { x: x - 2, y: bottom }, 2, colors.slab);
  }
}

/** The catwalk along the board's foot, with its railing. */
export function drawCatwalk(ctx: CanvasRenderingContext2D, board: Box) {
  const y = board.y + board.h + 6;
  ctx.fillStyle = colors.ink;
  ctx.fillRect(board.x - 4, y, board.w + 8, 4);
  beam(ctx, { x: board.x - 4, y: y - 9 }, { x: board.x + board.w + 4, y: y - 9 }, 1, colors.slab);
  for (let k = 0; k <= 10; k++) {
    const x = board.x - 4 + ((board.w + 8) * k) / 10;
    beam(ctx, { x, y }, { x, y: y - 9 }, 1, colors.slab);
  }
}

/** The steel frame round the board: a dark rim with a lighter lip along its top. */
export function drawRim(ctx: CanvasRenderingContext2D, board: Box) {
  ctx.fillStyle = colors.ink;
  ctx.fillRect(board.x - 5, board.y - 5, board.w + 10, board.h + 10);
  ctx.fillStyle = colors.slab;
  ctx.fillRect(board.x - 5, board.y - 5, board.w + 10, 2);
}

/** Three spotlights on arms over the board's top, each throwing a soft cone of light down its face. */
export function drawSpotlights(ctx: CanvasRenderingContext2D, board: Box, glow: number) {
  for (const along of [0.18, 0.5, 0.82]) {
    const x = board.x + board.w * along;
    const head = { x, y: board.y - 16 };
    beam(ctx, { x, y: board.y - 5 }, { x: head.x, y: head.y }, 2, colors.ink);
    const cone = ctx.createLinearGradient(0, head.y, 0, board.y + board.h * 0.7);
    cone.addColorStop(0, colors.glow);
    cone.addColorStop(1, colors.night);
    ctx.globalAlpha = 0.22 * glow;
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(head.x - 3, head.y + 2);
    ctx.lineTo(head.x + 3, head.y + 2);
    ctx.lineTo(head.x + board.w * 0.16, board.y + board.h * 0.7);
    ctx.lineTo(head.x - board.w * 0.16, board.y + board.h * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.ink;
    ctx.fillRect(head.x - 5, head.y - 3, 10, 5);
    ctx.globalAlpha = glow;
    ctx.fillStyle = colors.glow;
    ctx.fillRect(head.x - 4, head.y + 1, 8, 2);
    ctx.globalAlpha = 1;
  }
}
