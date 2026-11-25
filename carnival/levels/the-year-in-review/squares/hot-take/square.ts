import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { signFont, theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the doodle's motion takes there and back, in milliseconds. */
export const PERIOD = 1800;

/** Where the doodle's motion is at `time`, from -1 to 1 and back, gently. */
export const heatWave = (time: number) => Math.sin((time / PERIOD) * Math.PI * 2);

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

/** Hot take: a red chili pepper with heat rising off it in slow waves. */
const square: NorthPoleSquare = {
  id: 'hot-take',
  name: 'Hot take',
  description: "One hot take you'd bet on?",
  stall: { shape: 'kiosk', roof: 'snow', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      card(ctx);
      // A red chili pepper, and heat rising off it in slow waves.
      ctx.fillStyle = colors.berry;
      ctx.beginPath();
      ctx.moveTo(38, 30);
      ctx.quadraticCurveTo(52, 26, 62, 40);
      ctx.quadraticCurveTo(48, 38, 38, 34);
      ctx.fill();
      ctx.fillStyle = colors.pine;
      ctx.fillRect(35, 29, 4, 4);
      ctx.strokeStyle = colors.gingerbread;
      ctx.beginPath();
      for (const x of [44, 50, 56]) {
        const wave = heatWave(time + x * 40) * 1.5;
        ctx.moveTo(x, 26);
        ctx.quadraticCurveTo(x + wave, 22, x, 18);
      }
      ctx.stroke();
    });
  },
};

export default square;
