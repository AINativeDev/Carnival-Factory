import { theme } from './theme';

/**
 * Helpers for drawing a square as a small diorama at dusk, the way the world
 * draws itself: a slab of snowy ground seen from the world's isometric angle,
 * lit from the upper left, with warm lights and cool shadows. See docs/style.md.
 *
 * Everything here works in the square's own 0 to 100 units: `scene` scales the
 * context to the square's size before it calls `paint`, so a square drawn with
 * these reads the same on the map and on its visit card.
 */

const { colors } = theme;

export interface Point {
  x: number;
  y: number;
}

/** The ground slab: its middle on screen, how far it reaches along each side, and how thick it is. */
export const GROUND = { x: 50, y: 66, reach: 22, depth: 6 };

/**
 * Where a spot on the ground is on screen, `z` above it. `gx` runs down to the
 * right and `gy` down to the left, as the world's tiles do, from -reach to
 * reach across the slab.
 */
export function iso(gx: number, gy: number, z = 0): Point {
  return { x: GROUND.x + (gx - gy), y: GROUND.y + (gx + gy) / 2 - z };
}

// The far ridges, worked out once: [x, height] along each.
const RIDGES = [
  { base: 50, color: colors.mountainFar, peaks: [10, 18, 9, 22, 13, 20, 8, 16, 11] },
  { base: 56, color: colors.mountain, peaks: [8, 14, 6, 17, 10, 15, 7, 12, 9, 13] },
];
const STARS = [
  [8, 6],
  [21, 13],
  [34, 4],
  [47, 10],
  [63, 5],
  [72, 14],
  [86, 7],
  [94, 15],
  [15, 22],
  [57, 19],
];

/** The dusk sky, a few stars and the snowy mountains behind the slab. */
export function backdrop(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, 100);
  sky.addColorStop(0, colors.night);
  sky.addColorStop(0.3, colors.dusk);
  sky.addColorStop(0.5, colors.duskLow);
  sky.addColorStop(0.64, colors.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = colors.snow;
  ctx.globalAlpha = 0.6;
  for (const [x, y] of STARS) ctx.fillRect(x, y, 0.7, 0.7);
  ctx.globalAlpha = 1;
  for (const { base, color, peaks } of RIDGES) {
    const step = 100 / (peaks.length - 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 100);
    peaks.forEach((peak, n) => ctx.lineTo(n * step, base - peak));
    ctx.lineTo(100, 100);
    ctx.fill();
    // Snow on the peaks, lit on their left.
    ctx.fillStyle = colors.snowShade;
    ctx.globalAlpha = 0.7;
    peaks.forEach((peak, n) => {
      if (peak < (peaks[n - 1] ?? 0) || peak < (peaks[n + 1] ?? 0)) return;
      const x = n * step;
      const y = base - peak;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - step * 0.3, y + 4);
      ctx.lineTo(x + step * 0.25, y + 3.5);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  // Rolling snowy hills, nearer, fading into the dusk.
  ctx.fillStyle = colors.hill;
  ctx.beginPath();
  ctx.moveTo(0, 100);
  for (let x = 0; x <= 100; x += 5) ctx.lineTo(x, 58 + Math.sin(x / 11) * 2 + Math.sin(x / 5 + 1));
  ctx.lineTo(100, 100);
  ctx.fill();
  ctx.fillStyle = colors.slabShade;
  ctx.beginPath();
  ctx.moveTo(0, 100);
  for (let x = 0; x <= 100; x += 5) ctx.lineTo(x, 70 + Math.sin(x / 15 + 2) * 2);
  ctx.lineTo(100, 100);
  ctx.fill();
}

/** The slab of snowy ground the scene stands on: a lit top, two sides and a soft shadow under it. */
export function slab(ctx: CanvasRenderingContext2D) {
  const { reach: r, depth } = GROUND;
  box(ctx, -r, -r, 2 * r, 2 * r, depth, colors.snow, colors.slab, colors.slabShade, -depth);
  // The light falls from the upper left, so the far left of the snow is warmest.
  const top = ctx.createLinearGradient(GROUND.x - 2 * r, GROUND.y - r, GROUND.x + r, GROUND.y + r);
  top.addColorStop(0, colors.snowLit);
  top.addColorStop(0.55, colors.snow);
  top.addColorStop(1, colors.snowShade);
  ctx.fillStyle = top;
  diamond(ctx, iso(-r, -r), iso(r, -r), iso(r, r), iso(-r, r));
  ctx.fill();
  // A few drifts for texture.
  ctx.fillStyle = colors.snowShade;
  ctx.globalAlpha = 0.5;
  for (const [gx, gy, w] of [
    [-16, 12, 5],
    [14, -15, 4],
    [17, 16, 3],
  ]) {
    const p = iso(gx, gy);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, w, w / 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * The backdrop and the slab never change, so in a square's worker they are
 * drawn once for each size and copied in every frame after that.
 */
let still: { size: number; canvas: OffscreenCanvas } | undefined;

function backdropAndSlab(ctx: CanvasRenderingContext2D, size: number) {
  if (typeof OffscreenCanvas === 'undefined') {
    backdrop(ctx);
    slab(ctx);
    return;
  }
  if (still?.size !== size) {
    const canvas = new OffscreenCanvas(size, size);
    const layer = canvas.getContext('2d')!;
    layer.scale(size / 100, size / 100);
    backdrop(layer as unknown as CanvasRenderingContext2D);
    slab(layer as unknown as CanvasRenderingContext2D);
    still = { size, canvas };
  }
  ctx.drawImage(still.canvas, 0, 0, 100, 100);
}

/**
 * Draws a square's diorama: scales the context to 0 to 100 units, paints the
 * backdrop and the slab, then `paint` with the context still scaled.
 */
export function scene(
  ctx: CanvasRenderingContext2D,
  size: number,
  time: number,
  paint: (ctx: CanvasRenderingContext2D, time: number) => void,
) {
  ctx.save();
  ctx.scale(size / 100, size / 100);
  backdropAndSlab(ctx, size);
  paint(ctx, time);
  ctx.restore();
}

function diamond(ctx: CanvasRenderingContext2D, ...points: Point[]) {
  ctx.beginPath();
  points.forEach((p, n) => (n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
}

/**
 * A box on the ground from (gx, gy), `w` along gx and `d` along gy, standing
 * `h` high from `lift` above the ground: its lit left side, its shaded right
 * side and its top.
 */
export function box(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  w: number,
  d: number,
  h: number,
  top: string,
  left: string,
  right: string,
  lift = 0,
) {
  const at = (x: number, y: number, z: number) => iso(x, y, lift + z);
  ctx.fillStyle = left;
  diamond(ctx, at(gx, gy + d, 0), at(gx + w, gy + d, 0), at(gx + w, gy + d, h), at(gx, gy + d, h));
  ctx.fill();
  ctx.fillStyle = right;
  diamond(ctx, at(gx + w, gy + d, 0), at(gx + w, gy, 0), at(gx + w, gy, h), at(gx + w, gy + d, h));
  ctx.fill();
  ctx.fillStyle = top;
  diamond(ctx, at(gx, gy, h), at(gx + w, gy, h), at(gx + w, gy + d, h), at(gx, gy + d, h));
  ctx.fill();
}

/** A cool, soft shadow on the snow, cast a little to the lower right. */
export function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.ellipse(x + width * 0.08, y, width / 2, width / 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** A warm pool of light, as a lamp, a window or a fire throws, at `strength` from 0 to 1. */
export function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  strength = 1,
) {
  ctx.fillStyle = colors.lantern;
  for (const r of [radius, radius * 0.65, radius * 0.35]) {
    ctx.globalAlpha = 0.13 * strength;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

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
 * The front of a round thing, from angle `a` to `b` round it: 0 is the right,
 * PI/2 the front, as seen from the world's angle (so its ellipse is half as tall
 * as it is wide).
 */
function rim(x: number, y: number, rx: number, a: number) {
  return { x: x + Math.cos(a) * rx, y: y + (Math.sin(a) * rx) / 2 };
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
    const a = turn + (k / n) * Math.PI * 2;
    const b = a + (Math.PI * 2) / n;
    // Only the front half shows.
    const from = Math.max(clampFront(a), 0);
    const to = Math.min(clampFront(b), Math.PI);
    if (to <= from) continue;
    ctx.fillStyle = colours[k % colours.length];
    ctx.beginPath();
    const p = rim(x, y, rx, from);
    ctx.moveTo(p.x, p.y);
    for (let t = from; t <= to + 1e-6; t += (to - from) / 4) {
      const q = rim(x, y, rx, t);
      ctx.lineTo(q.x, q.y);
    }
    const q = rim(x, y, rx, to);
    ctx.lineTo(q.x, q.y - h);
    for (let t = to; t >= from - 1e-6; t -= (to - from) / 4) {
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

/** An angle moved into the half turn from -PI/2 to 3PI/2, so the front half is 0 to PI. */
function clampFront(a: number) {
  const t = (((a + Math.PI / 2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return t - Math.PI / 2;
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
    const a = turn + (k / n) * Math.PI * 2;
    const from = Math.max(clampFront(a), 0);
    const to = Math.min(clampFront(a + (Math.PI * 2) / n), Math.PI);
    if (to <= from) continue;
    ctx.fillStyle = colours[k % colours.length];
    ctx.beginPath();
    ctx.moveTo(peak.x, peak.y);
    for (let t = from; t <= to + 1e-6; t += (to - from) / 4) {
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

/** How bright string light `n` is at `time`: a slow, gentle shimmer, never a flash. */
export function shimmer(time: number, n: number) {
  return 0.8 + 0.2 * Math.sin(time / 900 + n * 1.9);
}

/** String lights hung at `points`, warm bulbs in `colours`, shimmering slowly. */
export function stringLights(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  colours: readonly string[],
  time: number,
) {
  ctx.strokeStyle = colors.ink;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  points.forEach((p, n) => (n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
  points.forEach((p, n) => {
    const strength = shimmer(time, n);
    ctx.fillStyle = colors.glow;
    ctx.globalAlpha = 0.3 * strength;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = strength;
    ctx.fillStyle = colours[n % colours.length];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 0.75, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/** A little snowy pine standing on (x, y), `h` tall. */
export function pine(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
  shadow(ctx, x, y, h * 0.6);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - h * 0.04, y - h * 0.15, h * 0.08, h * 0.15);
  for (const [base, width, top] of [
    [0.15, 0.32, 0.55],
    [0.4, 0.26, 0.78],
    [0.62, 0.18, 1],
  ]) {
    ctx.fillStyle = colors.pine;
    ctx.beginPath();
    ctx.moveTo(x - width * h, y - base * h);
    ctx.lineTo(x, y - top * h);
    ctx.lineTo(x, y - base * h);
    ctx.fill();
    ctx.fillStyle = colors.pineDark;
    ctx.beginPath();
    ctx.moveTo(x + width * h, y - base * h);
    ctx.lineTo(x, y - top * h);
    ctx.lineTo(x, y - base * h);
    ctx.fill();
    ctx.fillStyle = colors.snow;
    ctx.beginPath();
    ctx.moveTo(x - width * h * 0.45, y - (top - (top - base) * 0.55) * h);
    ctx.lineTo(x, y - top * h);
    ctx.lineTo(x + width * h * 0.3, y - (top - (top - base) * 0.6) * h);
    ctx.fill();
  }
}
