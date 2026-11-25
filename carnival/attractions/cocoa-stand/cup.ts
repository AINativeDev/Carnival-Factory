/**
 * The visitor's own cup of cocoa on the counter, and the urn that pours it:
 * the cocoa rising inside, the toppings dropping in, and steam once it's full.
 */
import { drum, glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { dropping, steam, type Cocoa } from './cocoa';

const { colors } = theme;

/** The cup's size in scene units: how round, and how tall. */
const RX = 4;
const HEIGHT = 7;

/** How far below the brim the cocoa stands in a cup `fill` full. */
const sunk = (fill: number) => (1 - fill) * (HEIGHT - 2);

/** The urn on the counter, with its spout reaching over the cup standing at (x, y). */
export function drawUrn(ctx: CanvasRenderingContext2D, x: number, y: number) {
  drum(ctx, x - 12, y - 6, 3.5, 9, [colors.gold, colors.cream], 4, 0.4, colors.cocoa);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - 8.5, y - 13.5, 9.5, 1.4);
  ctx.fillRect(x - 0.6, y - 13.5, 1.6, 2.5);
}

/** The stream of cocoa from the spout down to the cocoa in the cup at (x, y). */
export function drawPour(ctx: CanvasRenderingContext2D, x: number, y: number, fill: number) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 0.1, y - 11, 0.8, 11 - HEIGHT + sunk(fill));
}

/** The marshmallows floating on the cocoa, around (x, y). */
function marshmallows(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = colors.snowLit;
  for (const [dx, dy] of [
    [-1.8, -0.2],
    [0.4, 0.6],
    [1.6, -0.6],
  ] as const) {
    ctx.fillRect(x + dx - 0.8, y + dy - 0.6, 1.6, 1.2);
  }
}

/** A swirl of cream, three soft rings piled up from (x, y). */
function cream(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = colors.snowLit;
  [2.8, 2, 1.1].forEach((r, n) => {
    ctx.beginPath();
    ctx.ellipse(x - n * 0.3, y - n * 1.2, r, r / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** A candy cane leaning out of the cup from (x, y), striped white and red. */
function candyCane(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.1;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2.4, y - 8);
    ctx.arc(x + 3.8, y - 8, 1.4, Math.PI, 0);
  };
  ctx.strokeStyle = colors.snowLit;
  path();
  ctx.stroke();
  ctx.setLineDash([1, 1]);
  ctx.strokeStyle = colors.berry;
  path();
  ctx.stroke();
  ctx.setLineDash([]);
}

const TOPPING_DRAWS = [marshmallows, cream, candyCane];

/**
 * The cup standing on (x, y): the cocoa at its level inside, the toppings in so
 * far, the newest still dropping in, and, when `fade` is below 1, fading as
 * it's carried away.
 */
export function drawCup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cup: Cocoa,
  time: number,
  fade: number,
) {
  ctx.save();
  ctx.globalAlpha = fade;
  // The handle, then the cup with its dark, empty inside.
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x + RX + 0.4, y - HEIGHT / 2, 2, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  drum(ctx, x, y, RX, HEIGHT, [colors.berry, colors.cream], 3, 0.3, colors.ink);
  const brim = y - HEIGHT;
  if (cup.fill > 0) {
    // The cocoa's surface, sunk below the brim as far as the cup is empty,
    // seen through the cup's round mouth.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, brim, RX - 0.4, (RX - 0.4) / 2, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = colors.cocoa;
    ctx.beginPath();
    ctx.ellipse(x, brim + sunk(cup.fill), RX, RX / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const lift = dropping(cup, time) * 10;
  TOPPING_DRAWS.slice(0, cup.toppings).forEach((draw, n) => {
    draw(ctx, x, brim - (n === cup.toppings - 1 ? lift : 0));
  });
  ctx.restore();
}

/** Steam curling up from the full cup standing at (x, y), three wisps in turn. */
export function drawCupSteam(ctx: CanvasRenderingContext2D, x: number, base: number, time: number) {
  const y = base - HEIGHT - 2;
  glow(ctx, x, y, 8, 0.35);
  ctx.fillStyle = colors.snowLit;
  for (let wisp = 0; wisp < 3; wisp++) {
    const { rise, curl } = steam(wisp, time);
    ctx.globalAlpha = 0.55 * (1 - rise);
    ctx.beginPath();
    ctx.arc(x + curl * 2, y - rise * 18, 1 + rise * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
