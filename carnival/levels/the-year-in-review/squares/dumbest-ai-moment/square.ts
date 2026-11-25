import { glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { signFont, theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the doodle's motion takes there and back, in milliseconds. */
export const PERIOD = 1800;

/** Where the doodle's motion is at `time`, from -1 to 1 and back, gently. */
export const bubbleBob = (time: number) => Math.sin((time / PERIOD) * Math.PI * 2);

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

/** Dumbest AI moment: a robot, very sure of itself, its speech bubble bobbing as it says 2+2=5. */
const square: NorthPoleSquare = {
  id: 'dumbest-ai-moment',
  name: 'Dumbest AI moment',
  description: "What's the dumbest thing an AI confidently told you this year?",
  stall: { shape: 'kiosk', roof: 'berry', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      card(ctx);
      // A robot's head, very sure of itself, and its bubble bobbing as it says 2+2=5.
      ctx.fillStyle = colors.snowShade;
      ctx.fillRect(35, 25, 12, 12);
      ctx.fillRect(40.5, 21, 1, 4);
      ctx.fillStyle = colors.ice;
      ctx.fillRect(37, 28, 3, 3);
      ctx.fillRect(42, 28, 3, 3);
      const lift = bubbleBob(time) * 1.2;
      ctx.fillStyle = colors.snow;
      ctx.beginPath();
      ctx.ellipse(58, 22 + lift, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.ink;
      words(ctx, '2+2=5', 58, 22.5 + lift, 4.5);
    });
  },
};

export default square;
