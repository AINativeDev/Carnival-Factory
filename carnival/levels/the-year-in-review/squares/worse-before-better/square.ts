import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { signFont, theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the doodle's motion takes there and back, in milliseconds. */
export const PERIOD = 5000;

/** Where the doodle's motion is at `time`, from -1 to 1 and back, gently. */
export const dotAlong = (time: number) => Math.sin((time / PERIOD) * Math.PI * 2);

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

/** Worse before better: a chart that dips before it climbs, a dot travelling along it. */
const square: NorthPoleSquare = {
  id: 'worse-before-better',
  name: 'Worse before better',
  description: 'What gets worse before it gets better?',
  stall: { shape: 'kiosk', roof: 'snow', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      card(ctx);
      // A line that dips before it climbs, and a dot travelling along it.
      const y = (x: number) => 26 + Math.sin(((x - 34) / 32) * Math.PI) * 8 - (x - 34) * 0.3;
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = 34; x <= 66; x += 2) ctx.lineTo(x, y(x));
      ctx.stroke();
      ctx.lineWidth = 1;
      const at = 50 + dotAlong(time) * 16;
      ctx.fillStyle = colors.berry;
      ctx.beginPath();
      ctx.arc(at, y(at), 2, 0, Math.PI * 2);
      ctx.fill();
    });
  },
};

export default square;
