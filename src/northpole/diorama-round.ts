/**
 * The diorama's round shapes: a striped drum, as a carousel's base or a tent's
 * wall, and a striped cone roof over it, both seen from the world's angle and
 * shaded like its volumes. Kept apart because their arc arithmetic is the
 * fiddly part of the diorama, with tests of its own. Like the rest of the
 * diorama, it imports nothing but `./theme`, since every booth may import it.
 */
import { theme } from './theme';

const { colors } = theme;

/**
 * Shades the round thing whose outline is the current path, standing at `x`
 * and `rx` wide each way: its left lit, its right in shadow, in bands like the
 * world's volumes.
 */
function roundShade(ctx: CanvasRenderingContext2D, x: number, rx: number, top: number, h: number) {
  ctx.save();
  ctx.clip();
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(x + rx * 0.1, top, rx, h);
  ctx.globalAlpha = 0.18;
  ctx.fillRect(x + rx * 0.6, top, rx, h);
  ctx.fillStyle = colors.snowLit;
  ctx.globalAlpha = 0.14;
  ctx.fillRect(x - rx, top, rx * 0.55, h);
  ctx.restore();
}

/**
 * The point at angle `a` round a round thing: 0 is the right, PI/2 the front,
 * as seen from the world's angle (so its ellipse is half as tall as it is wide).
 */
function rim(x: number, y: number, rx: number, a: number) {
  return { x: x + Math.cos(a) * rx, y: y + (Math.sin(a) * rx) / 2 };
}

/** Five evenly spaced angles from `from` to `to`, both ends included, however close they are. */
export function arcSteps(from: number, to: number) {
  return [0, 1, 2, 3, 4].map((i) => from + ((to - from) * i) / 4);
}

/** An angle moved into the half turn from -PI/2 to 3PI/2, so the front half is 0 to PI. */
function clampFront(a: number) {
  const t = (((a + Math.PI / 2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return t - Math.PI / 2;
}

/**
 * The part of stripe `k` of `n`, turned by `turn`, that shows on the front
 * half, as angles from 0 to PI, or undefined when it is all round the back.
 */
function frontOfStripe(turn: number, k: number, n: number) {
  const a = turn + (k / n) * Math.PI * 2;
  const from = Math.max(clampFront(a), 0);
  const to = Math.min(clampFront(a + (Math.PI * 2) / n), Math.PI);
  return to <= from ? undefined : { from, to };
}

/** Sets the fill to stripe `k`'s colour; with no colours given, the fill stays as it was. */
function stripeColour(ctx: CanvasRenderingContext2D, colours: readonly string[], k: number) {
  const colour = colours.at(k % colours.length);
  if (colour !== undefined) ctx.fillStyle = colour;
}

/**
 * A drum standing on (x, y), `rx` round and `h` high, its side striped in
 * `stripes` bands of `colours` that turn by `turn` radians, and its top `top`.
 */
export function drum(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  h: number,
  colours: readonly string[],
  stripes: number,
  turn: number,
  top: string,
) {
  const ry = rx / 2;
  const n = stripes * 2;
  for (let k = 0; k < n; k++) {
    const front = frontOfStripe(turn, k, n);
    if (!front) continue;
    const { from, to } = front;
    stripeColour(ctx, colours, k);
    ctx.beginPath();
    const p = rim(x, y, rx, from);
    ctx.moveTo(p.x, p.y);
    for (const t of arcSteps(from, to)) {
      const q = rim(x, y, rx, t);
      ctx.lineTo(q.x, q.y);
    }
    const q = rim(x, y, rx, to);
    ctx.lineTo(q.x, q.y - h);
    for (const t of arcSteps(to, from)) {
      const r = rim(x, y, rx, t);
      ctx.lineTo(r.x, r.y - h);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI);
  ctx.lineTo(x - rx, y - h);
  ctx.ellipse(x, y - h, rx, ry, 0, Math.PI, 0, true);
  ctx.closePath();
  roundShade(ctx, x, rx, y - h - ry, h + 2 * ry);
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.ellipse(x, y - h, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * A cone roof on an ellipse round (x, y), `rx` round, up to a peak `h` above,
 * in `stripes` bands of `colours` that turn by `turn` radians.
 */
export function cone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  h: number,
  colours: readonly string[],
  stripes: number,
  turn: number,
) {
  const peak = { x, y: y - h };
  const n = stripes * 2;
  for (let k = 0; k < n; k++) {
    const front = frontOfStripe(turn, k, n);
    if (!front) continue;
    stripeColour(ctx, colours, k);
    ctx.beginPath();
    ctx.moveTo(peak.x, peak.y);
    for (const t of arcSteps(front.from, front.to)) {
      const p = rim(x, y, rx, t);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(peak.x, peak.y);
  ctx.lineTo(x + rx, y);
  ctx.ellipse(x, y, rx, rx / 2, 0, 0, Math.PI);
  ctx.closePath();
  roundShade(ctx, x, rx, peak.y, h + rx);
}
