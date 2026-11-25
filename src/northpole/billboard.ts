/**
 * The billboard by the road: what's on next for the people who build the
 * North Pole, AI DevCon in London, high on steel legs and lit by spotlights at dusk. It faces the
 * visitor square on, like a poster, so it reads at any zoom, and a click on it
 * opens the tickets page (map.ts asks `onBillboard`). The words are ours, set
 * here, never anything a participant wrote.
 */
import { drawCatwalk, drawLegs, drawRim, drawSpotlights } from './billboard-frame';
import { canvasFont, theme } from './theme';
import type { Box, Tile } from './world';

const { colors } = theme;

/** What the billboard says, and where its tickets are. */
export const BILLBOARD = {
  title: 'AI DevCon',
  next: 'Next in London',
  when: '7–8 June 2027 · The Brewery',
  cta: 'Get tickets',
  tickets: 'https://luma.com/aidevcon-ldn2027',
} as const;

/** The board's size and how high its posts hold it, in world pixels. */
export const BOARD = { w: 220, h: 96, post: 112 };

/** Where the board stands on screen when its posts' feet are at `foot`: what a click hits. */
export function billboardBox(foot: Tile): Box {
  return {
    x: foot.x - BOARD.w / 2,
    y: foot.y - BOARD.post - BOARD.h,
    w: BOARD.w,
    h: BOARD.h + BOARD.post,
  };
}

/** Whether a point on screen is on the billboard standing at `foot`. */
export function onBillboard(foot: Tile, point: Tile): boolean {
  const box = billboardBox(foot);
  return (
    point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h
  );
}

/** How bright the lamps over the board are at `time`: a slow, steady breath, never a flicker. */
export const lampGlow = (time: number) => 0.8 + 0.2 * Math.sin(time / 1500);

/** One line of the board's words, shrunk to fit `width`. */
function line(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  font: string,
  color: string,
) {
  ctx.font = font;
  const scale = Math.min(1, width / Math.max(1, ctx.measureText(text).width));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Draws the billboard with its legs' feet at `foot`, at `time` in milliseconds. */
export function drawBillboard(ctx: CanvasRenderingContext2D, foot: Tile, time: number) {
  const { x, y, w } = billboardBox(foot);
  const board = { x, y, w, h: BOARD.h };
  const glow = lampGlow(time);
  ctx.save();
  drawLegs(ctx, foot, board);
  drawCatwalk(ctx, board);
  drawRim(ctx, board);
  ctx.fillStyle = colors.night;
  ctx.fillRect(board.x, board.y, board.w, board.h);
  drawSpotlights(ctx, board, glow);
  // The words: what, where and when, and the way to tickets.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const middle = board.x + board.w / 2;
  line(
    ctx,
    BILLBOARD.title,
    middle,
    board.y + board.h * 0.24,
    board.w * 0.86,
    canvasFont('title', 'bold'),
    colors.gold,
  );
  line(
    ctx,
    BILLBOARD.next,
    middle,
    board.y + board.h * 0.48,
    board.w * 0.8,
    canvasFont('body', 'bold'),
    colors.cream,
  );
  line(
    ctx,
    BILLBOARD.when,
    middle,
    board.y + board.h * 0.66,
    board.w * 0.86,
    canvasFont('small'),
    colors.snowShade,
  );
  const tag = { w: board.w * 0.42, h: board.h * 0.18 };
  ctx.fillStyle = colors.berry;
  ctx.fillRect(middle - tag.w / 2, board.y + board.h * 0.76, tag.w, tag.h);
  line(
    ctx,
    `${BILLBOARD.cta} →`,
    middle,
    board.y + board.h * 0.76 + tag.h / 2,
    tag.w * 0.9,
    canvasFont('small', 'bold'),
    colors.snow,
  );
  ctx.restore();
}
