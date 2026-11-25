import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { signFont, theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the doodle's motion takes there and back, in milliseconds. */
export const PERIOD = 5000;

/** Where the doodle's motion is at `time`, from -1 to 1 and back, gently. */
export const sunRise = (time: number) => Math.sin((time / PERIOD) * Math.PI * 2);

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

/** My day in ’27: a sun rising over the horizon beside a calendar page for '27. */
const square: NorthPoleSquare = {
  id: 'my-day-in-27',
  name: "My day in '27",
  description: 'What will your day look like a year from now?',
  stall: { shape: 'kiosk', roof: 'snow', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      card(ctx);
      // A sun rising over the horizon, and a calendar page for '27.
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.arc(40, 36 - 3 - sunRise(time) * 2, 7, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = colors.ink;
      ctx.fillRect(32, 36, 18, 1);
      ctx.fillStyle = colors.berry;
      ctx.fillRect(54, 18, 12, 4);
      ctx.fillStyle = colors.snowShade;
      ctx.fillRect(54, 22, 12, 14);
      ctx.fillStyle = colors.ink;
      words(ctx, "'27", 60, 29.5, 5);
    });
  },
};

export default square;
