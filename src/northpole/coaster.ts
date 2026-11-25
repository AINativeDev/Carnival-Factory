/**
 * The roller coaster a level may lay (`coaster-ride.ts` says how it's
 * ridden): candy-striped rail on dark posts, high enough to walk under, with
 * loop-the-loops on A-frames, and the golden admission ticket riding it. The
 * ticket is a visitor's request on its way through the factory, so it's
 * drawn as an issue ticket: punched ends, a tear-off stub and a `#`. Only
 * the ticket moves, from `time`, and nothing flashes.
 */
import { glow, shadow } from './brushes';
import { legOf, loopHeading, loopPoint, LOOP_SIZE, railAt, ticketAt } from './coaster-ride';
import { signFont, theme } from './theme';
import { toScreen, type Thing, type Tile } from './world';

const { colors } = theme;

/** How many pieces a loop's rail is drawn in: enough to look round, in candy stripes. */
const LOOP_PIECES = 24;

/** A rail through `points`: a dark underside, then candy stripes, one colour per piece. */
function stripedRail(ctx: CanvasRenderingContext2D, points: Tile[]) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 8;
  ctx.beginPath();
  for (const { x, y } of points) ctx.lineTo(x, y + 1);
  ctx.stroke();
  ctx.lineWidth = 5;
  points.reduce((from, to, n) => {
    ctx.strokeStyle = n % 2 ? colors.berry : colors.snow;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    return to;
  });
  ctx.lineWidth = 1;
  ctx.lineCap = 'butt';
}

/** The points of a straight run from `a` to `b`, in `pieces` even steps. */
const run = (a: Tile, b: Tile, pieces: number): Tile[] =>
  Array.from({ length: pieces + 1 }, (_, n) => ({
    x: a.x + ((b.x - a.x) * n) / pieces,
    y: a.y + ((b.y - a.y) * n) / pieces,
  }));

/** A dark post from the snow up to `top`. */
function post(ctx: CanvasRenderingContext2D, foot: Tile, top: Tile) {
  ctx.strokeStyle = colors.night;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(foot.x, foot.y);
  ctx.lineTo(top.x, top.y);
  ctx.stroke();
  ctx.lineWidth = 1;
}

/** The rail into a piece and out of it again, through its middle. */
function railThrough(piece: Thing): { into: Tile[]; out: Tile[] } {
  const { enter, leave } = legOf(piece);
  const middle = railAt(piece);
  return { into: run(railAt(enter), middle, 2), out: run(middle, railAt(leave), 2) };
}

/** A tile of track on its post, with the ticket on it when it's riding by. */
export function drawCoaster(ctx: CanvasRenderingContext2D, piece: Thing, time: number) {
  const foot = toScreen(piece);
  shadow(ctx, foot.x, foot.y + 2, 10);
  post(ctx, foot, railAt(piece));
  const { into, out } = railThrough(piece);
  stripedRail(ctx, [...into, ...out.slice(1)]);
  drawTicket(ctx, piece, time);
}

/** A loop-the-loop on an A-frame over its tile, with the ticket going round it. */
export function drawCoasterLoop(ctx: CanvasRenderingContext2D, piece: Thing, time: number) {
  const foot = toScreen(piece);
  const middle = railAt(piece);
  const heading = loopHeading(piece);
  shadow(ctx, foot.x, foot.y + 2, 26);
  // The A-frame: a leg from the snow to each side of the loop, and a post under its foot.
  for (const side of [-1, 1]) {
    const spread = side * LOOP_SIZE * 1.4;
    const ground = { x: foot.x + heading.x * spread, y: foot.y + heading.y * spread };
    post(ctx, ground, loopPoint(middle, heading, (side * Math.PI) / 2));
  }
  post(ctx, foot, middle);
  const { into, out } = railThrough(piece);
  const loop = Array.from({ length: LOOP_PIECES + 1 }, (_, n) =>
    loopPoint(middle, heading, (n / LOOP_PIECES) * Math.PI * 2),
  );
  stripedRail(ctx, [...into, ...loop.slice(1), ...out.slice(1)]);
  glow(ctx, middle.x, middle.y - LOOP_SIZE, LOOP_SIZE * 0.8, 0.35);
  drawTicket(ctx, piece, time);
}

/** The golden ticket where it's riding, if it's on this piece now. */
function drawTicket(ctx: CanvasRenderingContext2D, piece: Thing, time: number) {
  const ticket = ticketAt(piece, time);
  if (!ticket) return;
  glow(ctx, ticket.x, ticket.y - 6, 18, 0.7);
  ctx.save();
  ctx.translate(ticket.x, ticket.y);
  ctx.rotate(ticket.angle);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-15, -18, 30, 15);
  ctx.strokeStyle = colors.cocoa;
  ctx.strokeRect(-15, -18, 30, 15);
  // The punched notch at each end, as on an admission ticket.
  ctx.fillStyle = colors.night;
  for (const end of [-15, 15]) {
    ctx.beginPath();
    ctx.arc(end, -10.5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // The tear-off stub's perforation, and the request's number sign.
  ctx.fillStyle = colors.cocoa;
  for (const y of [-16, -12, -8]) ctx.fillRect(7, y, 1.5, 2.5);
  ctx.font = signFont('slab', 12);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('#', -4, -10.5);
  ctx.restore();
}
