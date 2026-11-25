import { glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { signFont, theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the doodle's motion takes there and back, in milliseconds. */
export const PERIOD = 2200;

/** Where the doodle's motion is at `time`, from -1 to 1 and back, gently. */
export const dropSwing = (time: number) => Math.sin((time / PERIOD) * Math.PI * 2);

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

/** Vibe code regret: headphones over a tangle of code, and a bead of sweat. */
const square: NorthPoleSquare = {
  id: 'vibe-code-regret',
  name: 'Vibe code regret',
  description: 'What did you vibe code that you regret?',
  stall: { shape: 'kiosk', roof: 'berry', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      card(ctx);
      // Headphones over a tangle of code, and a bead of sweat.
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(50, 30, 10, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = colors.ink;
      ctx.fillRect(38, 29, 4, 7);
      ctx.fillRect(58, 29, 4, 7);
      ctx.strokeStyle = colors.berry;
      ctx.beginPath();
      ctx.moveTo(42, 40);
      ctx.bezierCurveTo(48, 28, 52, 46, 46, 36);
      ctx.bezierCurveTo(54, 30, 58, 42, 60, 38);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = colors.ice;
      ctx.beginPath();
      ctx.arc(63, 22 + dropSwing(time), 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
  },
};

export default square;
