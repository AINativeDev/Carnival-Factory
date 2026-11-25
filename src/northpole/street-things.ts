/**
 * The small things along the paths: snowdrifts, lamp posts, picket fences,
 * park benches, the cocoa cart and Santa's sleigh, which also waits on every
 * sleigh platform.
 */
import { block, glow, middle, shadow } from './brushes';
import { theme } from './theme';
import { TILE_W, toScreen, type Thing } from './world';

const { colors } = theme;

/** Snowdrifts lie on the ground, under everything standing. */
export function drawDrift(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  const width = 14 + 8 * thing.seed;
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, width, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.ellipse(x - 2, y, width * 0.8, 5, 0, Math.PI, 0);
  ctx.ellipse(x + width * 0.3, y, width * 0.45, 8, 0, Math.PI, 0);
  ctx.fill();
}

/** A lamp post, its light glowing in the dark. */
export function drawLamp(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  const breath = 0.8 + 0.2 * Math.sin(time / 900 + thing.seed * 20);
  glow(ctx, x, y - 44, 34, breath);
  ctx.fillStyle = colors.night;
  ctx.fillRect(x - 2, y - 42, 4, 44);
  ctx.fillRect(x - 5, y - 2, 10, 4);
  ctx.fillRect(x - 6, y - 50, 12, 3);
  ctx.fillStyle = colors.glow;
  ctx.fillRect(x - 4, y - 47, 8, 7);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 6, y - 52, 12, 2);
}

/** A stretch of picket fence across the tile, snow on its rails. */
export function drawFence(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  const w = TILE_W / 2 - 4;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - w, y - 14, 2 * w, 3);
  ctx.fillRect(x - w, y - 6, 2 * w, 3);
  for (let px = -w; px <= w; px += w / 2) ctx.fillRect(x + px - 2, y - 20, 4, 20);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - w, y - 16, 2 * w, 2);
  for (let px = -w; px <= w; px += w / 2) ctx.fillRect(x + px - 2, y - 22, 4, 3);
}

/** A park bench, snow on its seat. */
export function drawBench(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 16);
  const seat = { x: thing.x + 0.15, y: thing.y + 0.35, w: 0.7, h: 0.3 };
  ctx.fillStyle = colors.night;
  ctx.fillRect(x - 12, y - 8, 2, 8);
  ctx.fillRect(x + 10, y - 8, 2, 8);
  block(ctx, { ...seat, y: seat.y - 0.12, h: 0.08 }, 12, colors.snow, colors.wood, colors.cocoa, 8);
  block(ctx, seat, 3, colors.snow, colors.wood, colors.cocoa, 8);
}

/** A cocoa cart on wheels, under a striped canopy, its lantern lit. */
export function drawCart(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 22);
  const body = { x: thing.x + 0.1, y: thing.y + 0.25, w: 0.8, h: 0.5 };
  block(ctx, body, 20, colors.gingerbread, colors.berry, colors.cocoa, 6);
  ctx.fillStyle = colors.night;
  for (const dx of [-12, 10]) {
    ctx.beginPath();
    ctx.arc(x + dx, y + 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 16, y - 46, 2, 22);
  ctx.fillRect(x + 14, y - 46, 2, 22);
  for (let n = 0; n < 4; n++) {
    ctx.fillStyle = n % 2 ? colors.snow : colors.pine;
    ctx.fillRect(x - 20 + n * 10, y - 52, 10, 8);
  }
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 21, y - 54, 42, 3);
  glow(ctx, x + 12, y - 38, 20, 0.7 + 0.3 * Math.sin(time / 700 + thing.seed * 10));
  ctx.fillStyle = colors.lantern;
  ctx.fillRect(x + 9, y - 42, 6, 7);
}

/** Santa's sleigh, parked, with a sack of presents. */
export function drawSleigh(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = middle(thing);
  shadow(ctx, x, y + 4, 40);
  ctx.save();
  ctx.translate(x, y);
  // Runners.
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(26, 0);
  ctx.quadraticCurveTo(40, 0, 38, -12);
  ctx.stroke();
  ctx.lineWidth = 1;
  // The body, curling up at the front.
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(-32, -6);
  ctx.lineTo(22, -6);
  ctx.quadraticCurveTo(36, -10, 34, -30);
  ctx.quadraticCurveTo(24, -26, 20, -18);
  ctx.lineTo(-10, -18);
  ctx.lineTo(-14, -34);
  ctx.lineTo(-32, -34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-32, -12, 54, 3);
  // The sack of presents.
  ctx.fillStyle = colors.gingerbread;
  ctx.beginPath();
  ctx.ellipse(2, -26, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.pine;
  ctx.fillRect(-8, -44, 10, 10);
  ctx.fillStyle = colors.violet;
  ctx.fillRect(4, -42, 9, 8);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(-32, -36, 18, 3);
  ctx.restore();
}
