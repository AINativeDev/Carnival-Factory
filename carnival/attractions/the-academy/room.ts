/**
 * The classroom at dusk, seen straight on: a plank wall with two arched
 * windows onto the snowy evening, string lights over the chalkboard, the
 * pile of books the teacher stands on, and a wooden floor running back to
 * the wall. Warm light falls from the upper left, as everywhere on the map.
 */
import { glow, stringLights } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { scatter } from './chalk';

const { colors } = theme;

/** Where the wall meets the floor. */
const FLOOR = 63;

/** A window's arched opening, `w` wide and `h` tall, from its top-left corner. */
function arch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + w / 2);
  ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

/** An arched window onto the dusk: the sky, far hills and snow falling slowly past it. */
function windowOnDusk(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const w = 12;
  const h = 22;
  ctx.fillStyle = colors.gingerbread;
  arch(ctx, x - 1.2, y - 1.2, w + 2.4, h + 2.4);
  ctx.fill();
  ctx.save();
  arch(ctx, x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, colors.night);
  sky.addColorStop(0.45, colors.dusk);
  sky.addColorStop(0.8, colors.duskLow);
  sky.addColorStop(1, colors.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = colors.mountain;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + h - 4);
  ctx.lineTo(x + w * 0.35, y + h - 8);
  ctx.lineTo(x + w * 0.7, y + h - 5);
  ctx.lineTo(x + w, y + h - 7);
  ctx.lineTo(x + w, y + h);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  for (let n = 0; n < 9; n++) {
    const fall = ((time / (5_000 + n * 400) + scatter(n + x)) % 1) * (h + 4) - 2;
    const drift = Math.sin(time / 1_400 + n) * 0.8;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(x + scatter(n * 3 + x) * w + drift, y + fall, 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // The cross of glazing bars, and snow piled on the sill.
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(x + w / 2 - 0.4, y, 0.8, h);
  ctx.fillRect(x, y + h * 0.55, w, 0.8);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 1.8, y + h + 0.8, w + 3.6, 1.4);
}

/** The pile of books the teacher stands on, by the left window. */
function books(ctx: CanvasRenderingContext2D) {
  const pile: [string, number][] = [
    [colors.berry, 14],
    [colors.pine, 12],
    [colors.violet, 13],
  ];
  pile.forEach(([colour, w], n) => {
    const y = FLOOR - 2.4 * (n + 1);
    ctx.fillStyle = colour;
    ctx.fillRect(9.5 - w / 2 + n * 0.6, y, w, 2.4);
    ctx.fillStyle = colors.cream;
    ctx.fillRect(9.5 + w / 2 + n * 0.6 - 1.2, y + 0.5, 0.9, 1.4);
  });
}

/** The floor: boards running back to the wall, lit warmest near the lanterns. */
function floor(ctx: CanvasRenderingContext2D) {
  const boards = ctx.createLinearGradient(0, FLOOR, 0, 100);
  boards.addColorStop(0, colors.gingerbread);
  boards.addColorStop(1, colors.wood);
  ctx.fillStyle = boards;
  ctx.fillRect(0, FLOOR, 100, 100 - FLOOR);
  ctx.strokeStyle = colors.cocoa;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 0.3;
  for (let x = -60; x <= 160; x += 11) {
    ctx.beginPath();
    ctx.moveTo(50 + (x - 50) * 0.55, FLOOR);
    ctx.lineTo(x, 100);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(0, FLOOR - 0.8, 100, 1.2);
}

/** The whole room behind the board, the teacher and the cards. */
export function room(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(0, 0, 100, FLOOR);
  ctx.strokeStyle = colors.wood;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 0.35;
  for (let x = 4; x < 100; x += 6.5) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FLOOR);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // The wainscot along the foot of the wall, with its rail.
  ctx.fillStyle = colors.wood;
  ctx.fillRect(0, FLOOR - 8, 100, 8);
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(0, FLOOR - 8.6, 100, 1);
  glow(ctx, 10, 18, 30, 0.7);
  windowOnDusk(ctx, 2.5, 7, time);
  windowOnDusk(ctx, 85.5, 7, time);
  floor(ctx);
  books(ctx);
  const lights = Array.from({ length: 13 }, (_, n) => ({
    x: 17 + n * 5.5,
    y: 2.2 + Math.sin((n / 12) * Math.PI) * 1.6,
  }));
  stringLights(ctx, lights, [colors.berry, colors.gold, colors.mint, colors.violet], time);
}
