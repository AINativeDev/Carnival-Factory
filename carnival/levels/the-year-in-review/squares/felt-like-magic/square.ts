import { glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { signFont, theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the doodle's motion takes there and back, in milliseconds. */
export const PERIOD = 2600;

/** Where the doodle's motion is at `time`, from -1 to 1 and back, gently. */
export const sparkle = (time: number) => Math.sin((time / PERIOD) * Math.PI * 2);

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

/** When it felt like magic: a wand with a gold star, and sparkles that brighten and fade slowly. */
const square: NorthPoleSquare = {
  id: 'felt-like-magic',
  name: 'When it felt like magic',
  description: 'When did it actually feel like magic?',
  stall: { shape: 'kiosk', roof: 'berry', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      card(ctx);
      // A wand with a gold star at its tip, and sparkles brightening and fading slowly.
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(38, 40);
      ctx.lineTo(54, 24);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.arc(55, 23, 2.4, 0, Math.PI * 2);
      ctx.fill();
      for (const [n, [x, y]] of (
        [
          [60, 18],
          [62, 28],
          [50, 17],
          [64, 22],
        ] as const
      ).entries()) {
        ctx.globalAlpha = 0.6 + 0.4 * sparkle(time + n * 500);
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
      ctx.globalAlpha = 1;
    });
  },
};

export default square;
