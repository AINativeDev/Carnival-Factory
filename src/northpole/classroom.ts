/**
 * A classroom's furniture for an indoor level (ADR 0040): a pupil's desk with
 * its chair, or with a variant over a half the teacher's desk, with an apple
 * and a pile of books, and a globe on a stand that turns slowly.
 */
import { block, shadow } from './brushes';
import { phase } from './elf';
import { inset } from './furniture';
import { theme } from './theme';
import { toScreen, type Thing } from './world';

const { colors } = theme;

/** A pupil's desk and chair, or the teacher's desk with an apple and books when its variant is over a half. */
export function drawDesk(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 20);
  const teacher = thing.seed > 0.5;
  if (!teacher) {
    // The chair, behind the desk as the visitor sees it.
    const chair = { x: thing.x + 0.25, y: thing.y + 0.55, w: 0.4, h: 0.35 };
    block(
      ctx,
      { ...chair, y: chair.y + 0.28, h: 0.07 },
      26,
      colors.berry,
      colors.berry,
      colors.cocoa,
    );
    block(ctx, chair, 4, colors.berry, colors.cocoa, colors.cocoa, 12);
  }
  ctx.fillStyle = colors.cocoa;
  for (const [dx, dy] of [
    [-12, -2],
    [12, -2],
    [-2, 4],
    [2, -8],
  ] as const)
    ctx.fillRect(x + dx - 1, y + dy - 18, 2, 18);
  const top = teacher ? inset(thing, 0.05) : { ...inset(thing, 0.15), h: 0.4 };
  block(
    ctx,
    top,
    teacher ? 22 : 4,
    colors.gingerbread,
    colors.wood,
    colors.cocoa,
    teacher ? 0 : 18,
  );
  const lift = 22;
  if (teacher) {
    ctx.fillStyle = colors.berry;
    ctx.beginPath();
    ctx.arc(x - 8, y - lift - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.pine;
    ctx.fillRect(x - 8, y - lift - 10, 2, 3);
    for (const [n, color] of [colors.mint, colors.gold, colors.violet].entries()) {
      ctx.fillStyle = color;
      ctx.fillRect(x + 4, y - lift - 4 - n * 4, 14, 4);
    }
  } else {
    // An open exercise book on the desk.
    ctx.fillStyle = colors.cream;
    ctx.fillRect(x - 6, y - lift - 4, 12, 4);
  }
}

/** How long the globe takes to turn once, in milliseconds. */
const SPIN = 20_000;

/** A globe on a wooden stand, its land sliding round as it turns. */
export function drawGlobe(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 14);
  block(ctx, inset(thing, 0.34), 10, colors.wood, colors.cocoa, colors.cocoa);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 1, y - 24, 2, 14);
  const ball = { x, y: y - 34 };
  ctx.fillStyle = colors.ice;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 12, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = colors.pine;
  const turned = phase(time, SPIN, thing.seed);
  for (const [n, [lat, wide]] of (
    [
      [-4, 7],
      [3, 5],
      [-1, 4],
    ] as const
  ).entries()) {
    const along = ((turned + n / 3) % 1) * 36 - 18;
    ctx.beginPath();
    ctx.ellipse(ball.x + along, ball.y + lat, wide, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 14, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.stroke();
}
