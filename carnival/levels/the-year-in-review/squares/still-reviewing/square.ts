import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { signFont, theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the doodle's motion takes there and back, in milliseconds. */
export const PERIOD = 4000;

/** Where the doodle's motion is at `time`, from -1 to 1 and back, gently. */
export const lensAlong = (time: number) => Math.sin((time / PERIOD) * Math.PI * 2);

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

/** Still reviewing code?: lines of code and a magnifying glass going up and down them. */
const square: NorthPoleSquare = {
  id: 'still-reviewing',
  name: 'Still reviewing code?',
  description: 'Will we still be reviewing every line of code?',
  stall: { shape: 'kiosk', roof: 'snow', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      card(ctx);
      // Lines of code, and a magnifying glass going up and down them.
      for (const [n, wide] of [18, 24, 14, 22, 16].entries()) {
        ctx.fillStyle = n % 2 ? colors.violet : colors.ink;
        ctx.fillRect(36 + (n % 3) * 2, 19 + n * 4.5, wide, 1.6);
      }
      const lens = { x: 52, y: 29 + lensAlong(time) * 8 };
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(lens.x, lens.y, 5, 0, Math.PI * 2);
      ctx.moveTo(lens.x + 3.5, lens.y + 3.5);
      ctx.lineTo(lens.x + 8, lens.y + 8);
      ctx.stroke();
      ctx.lineWidth = 1;
    });
  },
};

export default square;
