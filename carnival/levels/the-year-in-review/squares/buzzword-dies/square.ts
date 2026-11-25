import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { signFont, theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the doodle's motion takes there and back, in milliseconds. */
export const PERIOD = 3600;

/** Where the doodle's motion is at `time`, from -1 to 1 and back, gently. */
export const beeRound = (time: number) => Math.sin((time / PERIOD) * Math.PI * 2);

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

/** The buzzword that dies: a gravestone for a buzzword, RIP, with a bee buzzing round it. */
const square: NorthPoleSquare = {
  id: 'buzzword-dies',
  name: 'The buzzword that dies',
  description: 'What buzzword dies next year?',
  stall: { shape: 'kiosk', roof: 'snow', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      card(ctx);
      // A gravestone for a buzzword, and a bee buzzing slowly round it.
      ctx.fillStyle = colors.slabShade;
      ctx.beginPath();
      ctx.moveTo(42, 41);
      ctx.lineTo(42, 26);
      ctx.arc(50, 26, 8, Math.PI, 0);
      ctx.lineTo(58, 41);
      ctx.fill();
      ctx.fillStyle = colors.ink;
      words(ctx, 'RIP', 50, 29, 5);
      const turn = beeRound(time) * Math.PI;
      const bee = { x: 50 + Math.cos(turn) * 13, y: 24 + Math.sin(turn) * 5 };
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.ellipse(bee.x, bee.y, 2.4, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.ink;
      ctx.fillRect(bee.x - 0.5, bee.y - 1.6, 1, 3.2);
    });
  },
};

export default square;
