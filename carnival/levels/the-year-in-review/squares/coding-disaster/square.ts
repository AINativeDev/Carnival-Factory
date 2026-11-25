import { glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { signFont, theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the doodle's motion takes there and back, in milliseconds. */
export const PERIOD = 1400;

/** Where the doodle's motion is at `time`, from -1 to 1 and back, gently. */
export const flameFlicker = (time: number) => Math.sin((time / PERIOD) * Math.PI * 2);

/** Words centred at (x, y), `px` scene units tall, in the colour already set. */
function words(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, px: number) {
  ctx.font = signFont('rounded', px);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

/**
 * The easel and the card on it, for the old masters' wing: a heavy gilded
 * frame round a parchment card, a brass plaque, and the year it looks back on.
 */
function card(ctx: CanvasRenderingContext2D) {
  const foot = iso(0, 4);
  shadow(ctx, foot.x, foot.y, 30);
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const [from, to] of [
    [36, 44],
    [64, 56],
    [50, 50],
  ] as const) {
    ctx.moveTo(from, foot.y + (from === 50 ? -6 : 0));
    ctx.lineTo(to, 14);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
  glow(ctx, 50, 28, 26, 0.6);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(28, 10, 44, 38);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(30.5, 12.5, 39, 33);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(32, 14, 36, 30);
  ctx.fillStyle = colors.lantern;
  for (const [x, y] of [
    [28, 10],
    [72, 10],
    [28, 48],
    [72, 48],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = colors.gold;
  ctx.fillRect(42, 50, 16, 4);
  ctx.fillStyle = colors.cocoa;
  words(ctx, "'26", 50, 52.2, 3.2);
}

/** Worst coding disaster: a laptop with a small fire on it, its flame flickering gently. */
const square: NorthPoleSquare = {
  id: 'coding-disaster',
  name: 'Worst coding disaster',
  description: 'Worst AI coding disaster you lived through?',
  stall: { shape: 'kiosk', roof: 'berry', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      card(ctx);
      // A laptop, and a small fire on it, flickering gently.
      ctx.fillStyle = colors.surface;
      ctx.fillRect(38, 22, 24, 14);
      ctx.fillStyle = colors.ink;
      ctx.fillRect(35, 36, 30, 3);
      const tall = 9 + flameFlicker(time) * 1.5;
      for (const [color, scale] of [
        [colors.berry, 1],
        [colors.gold, 0.6],
      ] as const) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(44, 36);
        ctx.quadraticCurveTo(50, 36 - tall * scale * 1.6, 56, 36);
        ctx.fill();
      }
    });
  },
};

export default square;
