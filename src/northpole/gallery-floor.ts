/**
 * What stands on the Year in Review's floor (ADR 0047): statues on plinths
 * (a marble elf in a toga, stacked spheres, a twisted ribbon), a mobile that
 * slowly turns overhead, a velvet rope on brass posts before the old masters,
 * and a small sign that says WET PAINT or DO NOT TOUCH. Drawn in world pixels
 * with their feet at the tile, like the rest of the furniture.
 */
import { block, shadow } from './brushes';
import { inset } from './furniture';
import { signFont, theme } from './theme';
import { toScreen, type Thing } from './world';

const { colors } = theme;

/** The plinth every statue stands on: white, waist high. Gives the top's middle. */
function plinth(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 16);
  block(ctx, inset(thing, 0.25), 26, colors.snow, colors.snowShade, colors.slab);
  return { x, y: y - 26 };
}

/** A marble elf in a toga, its pointed hat in marble too. */
function marbleElf(ctx: CanvasRenderingContext2D, top: { x: number; y: number }) {
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.moveTo(top.x - 9, top.y);
  ctx.lineTo(top.x + 9, top.y);
  ctx.lineTo(top.x + 5, top.y - 24);
  ctx.lineTo(top.x - 5, top.y - 24);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.moveTo(top.x - 6, top.y - 22);
  ctx.lineTo(top.x + 7, top.y - 4);
  ctx.lineTo(top.x + 2, top.y - 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(top.x, top.y - 30, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(top.x - 6, top.y - 33);
  ctx.lineTo(top.x + 6, top.y - 33);
  ctx.lineTo(top.x + 9, top.y - 46);
  ctx.fill();
}

/** Three spheres stacked off-centre, in gold, berry and ice. */
function spheres(ctx: CanvasRenderingContext2D, top: { x: number; y: number }) {
  for (const [n, color] of [colors.gold, colors.berry, colors.ice].entries()) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(top.x + (n % 2 ? 3 : -2), top.y - 8 - n * 13, 8 - n, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A ribbon of bronze twisting up from the plinth, turning a little as you look. */
function ribbon(ctx: CanvasRenderingContext2D, top: { x: number; y: number }, time: number) {
  const twist = Math.sin(time / 5000) * 4;
  ctx.strokeStyle = colors.gingerbread;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(top.x - 6, top.y);
  ctx.bezierCurveTo(
    top.x + 14 + twist,
    top.y - 14,
    top.x - 14 - twist,
    top.y - 28,
    top.x + 4,
    top.y - 44,
  );
  ctx.stroke();
  ctx.lineWidth = 1;
}

/** A statue on its plinth: the marble elf, the spheres or the ribbon, by its variant. */
export function drawStatue(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const top = plinth(ctx, thing);
  if (thing.seed < 1 / 3) marbleElf(ctx, top);
  else if (thing.seed < 2 / 3) spheres(ctx, top);
  else ribbon(ctx, top, time);
}

/** How far the mobile has turned at `time`: one slow turn a minute. */
export const mobileTurn = (time: number, seed: number) => (time / 60_000 + seed) * Math.PI * 2;

/** A mobile hanging high overhead, its arms and shapes turning slowly; people walk under it. */
export function drawMobile(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  const high = y - 96;
  ctx.strokeStyle = colors.ink;
  ctx.beginPath();
  ctx.moveTo(x, high - 30);
  ctx.lineTo(x, high);
  const turn = mobileTurn(time, thing.seed);
  const shapes = [colors.berry, colors.gold, colors.mint, colors.violet];
  for (const [n, color] of shapes.entries()) {
    const reach = Math.cos(turn + (n * Math.PI) / 2) * (14 + n * 4);
    ctx.moveTo(x, high);
    ctx.lineTo(x + reach, high + 4);
    ctx.lineTo(x + reach, high + 12 + n * 3);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + reach, high + 16 + n * 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
  }
}

/** A velvet rope on two brass posts, keeping visitors a step back from the old masters. */
export function drawVelvetRope(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  const near = { x: x - 14, y: y - 4 };
  const far = { x: x + 14, y: y + 4 };
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(near.x, near.y - 24);
  ctx.quadraticCurveTo(x, y - 8, far.x, far.y - 24);
  ctx.stroke();
  ctx.lineWidth = 1;
  for (const post of [near, far]) {
    ctx.fillStyle = colors.gold;
    ctx.fillRect(post.x - 1.5, post.y - 26, 3, 26);
    ctx.beginPath();
    ctx.arc(post.x, post.y - 27, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A small sign on a stand: WET PAINT, or DO NOT TOUCH, by its variant. */
export function drawArtSign(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(x - 1, y - 20, 2, 20);
  ctx.fillStyle = thing.seed < 0.5 ? colors.gold : colors.snow;
  ctx.fillRect(x - 16, y - 34, 32, 16);
  ctx.fillStyle = colors.ink;
  ctx.font = signFont('condensed', 8);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(thing.seed < 0.5 ? 'WET PAINT' : 'DO NOT TOUCH', x, y - 26);
}
