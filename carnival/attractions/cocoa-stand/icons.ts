/**
 * A small picture of each thing that goes in a cup, for the buttons and the
 * order bubbles: a mug of cocoa, marshmallows, a swirl of cream, cinnamon
 * sticks and a candy cane. Each is drawn centred on (x, y), `s` units to a
 * unit, so one drawing serves every size.
 */
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** A mug of cocoa with a wisp of steam. */
function mug(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 0.9 * s;
  ctx.beginPath();
  ctx.arc(x + 2.6 * s, y + 0.6 * s, 1.4 * s, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  ctx.fillRect(x - 2.6 * s, y - 1.6 * s, 5.2 * s, 4.4 * s);
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.ellipse(x, y - 1.6 * s, 2.6 * s, 0.8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.snowLit;
  ctx.lineWidth = 0.5 * s;
  ctx.beginPath();
  ctx.moveTo(x - 0.6 * s, y - 2.6 * s);
  ctx.quadraticCurveTo(x + 0.8 * s, y - 3.6 * s, x - 0.2 * s, y - 4.6 * s);
  ctx.stroke();
}

/** Three marshmallows, lit on top. */
function marshmallows(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  for (const [dx, dy] of [
    [-1.6, 0.6],
    [1.4, 0.8],
    [0, -1.2],
  ] as const) {
    ctx.fillStyle = colors.snowShade;
    ctx.fillRect(x + (dx - 1.2) * s, y + (dy - 0.6) * s, 2.4 * s, 2 * s);
    ctx.fillStyle = colors.snowLit;
    ctx.fillRect(x + (dx - 1.2) * s, y + (dy - 1) * s, 2.4 * s, 0.9 * s);
  }
}

/** A swirl of cream, three soft rings piled up. */
function cream(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  [3, 2.2, 1.3].forEach((r, n) => {
    ctx.fillStyle = n % 2 ? colors.snowLit : colors.cream;
    ctx.beginPath();
    ctx.ellipse(x - n * 0.3 * s, y + (1.6 - n * 1.3) * s, r * s, r * 0.55 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = colors.snowLit;
  ctx.beginPath();
  ctx.arc(x - 0.6 * s, y - 1.8 * s, 0.6 * s, 0, Math.PI * 2);
  ctx.fill();
}

/** Two cinnamon sticks, crossed, with a dusting round them. */
function cinnamon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.lineCap = 'round';
  for (const [dx, tilt] of [
    [-0.6, -0.5],
    [0.6, 0.5],
  ] as const) {
    ctx.strokeStyle = colors.gingerbread;
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.moveTo(x + (dx - tilt * 3) * s, y + 2.8 * s);
    ctx.lineTo(x + (dx + tilt * 3) * s, y - 2.8 * s);
    ctx.stroke();
    ctx.strokeStyle = colors.wood;
    ctx.lineWidth = 0.4 * s;
    ctx.stroke();
  }
  ctx.fillStyle = colors.gingerbread;
  for (let n = 0; n < 5; n++) ctx.fillRect(x + (n - 2) * 1.2 * s, y + 3.4 * s, 0.5 * s, 0.5 * s);
}

/** A candy cane, striped white and red. */
function candyCane(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.lineCap = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x - 0.8 * s, y + 3.4 * s);
    ctx.lineTo(x - 0.8 * s, y - 1.4 * s);
    ctx.arc(x + 0.6 * s, y - 1.4 * s, 1.4 * s, Math.PI, 0);
  };
  ctx.lineWidth = 1.2 * s;
  ctx.strokeStyle = colors.snowLit;
  path();
  ctx.stroke();
  ctx.setLineDash([0.9 * s, 0.9 * s]);
  ctx.strokeStyle = colors.berry;
  path();
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Draws `item`'s picture (0 cocoa, then the four toppings) centred on (x, y) at scale `s`. */
export function icon(ctx: CanvasRenderingContext2D, item: number, x: number, y: number, s: number) {
  switch (item) {
    case 0:
      mug(ctx, x, y, s);
      break;
    case 1:
      marshmallows(ctx, x, y, s);
      break;
    case 2:
      cream(ctx, x, y, s);
      break;
    case 3:
      cinnamon(ctx, x, y, s);
      break;
    default:
      candyCane(ctx, x, y, s);
  }
}
