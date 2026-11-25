import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { signFont, theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the doodle's motion takes there and back, in milliseconds. */
export const PERIOD = 3000;

/** Where the doodle's motion is at `time`, from -1 to 1 and back, gently. */
export const wrenchTurn = (time: number) => Math.sin((time / PERIOD) * Math.PI * 2);

/** Words centred at (x, y), `px` scene units tall, in the colour already set. */
function words(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, px: number) {
  ctx.font = signFont('rounded', px);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

/**
 * The plinth and the card on it, for the modern wing: a white plinth, a thin
 * black frame round a white card, and a sticker with the year it looks to.
 */
function card(ctx: CanvasRenderingContext2D) {
  const foot = iso(0, 0);
  shadow(ctx, foot.x, foot.y, 26);
  box(ctx, -7, -7, 14, 14, 12, colors.snow, colors.snowShade, colors.slab);
  glow(ctx, 50, 28, 26, 0.5);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(30, 10, 40, 36);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(31.2, 11.2, 37.6, 33.6);
  ctx.fillStyle = colors.mint;
  ctx.beginPath();
  ctx.arc(66, 42, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  words(ctx, "'27", 66, 42.3, 3.6);
}

/** Finally fixed: a wrench turning gently beside a bug, and a green tick. */
const square: NorthPoleSquare = {
  id: 'finally-fixed',
  name: 'Finally fixed',
  description: "What's the thing that finally gets fixed?",
  stall: { shape: 'kiosk', roof: 'snow', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      card(ctx);
      // A bug, a wrench turning gently to fix it, and a tick.
      ctx.fillStyle = colors.ink;
      ctx.beginPath();
      ctx.ellipse(42, 30, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.ink;
      ctx.beginPath();
      for (const y of [26, 30, 34]) {
        ctx.moveTo(35, y);
        ctx.lineTo(49, y);
      }
      ctx.stroke();
      ctx.save();
      ctx.translate(56, 30);
      ctx.rotate(-0.6 + wrenchTurn(time) * 0.25);
      ctx.fillStyle = colors.slabShade;
      ctx.fillRect(-1.2, -2, 2.4, 12);
      ctx.beginPath();
      ctx.arc(0, -3, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = colors.pine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(58, 20);
      ctx.lineTo(61, 23);
      ctx.lineTo(66, 16);
      ctx.stroke();
      ctx.lineWidth = 1;
    });
  },
};

export default square;
