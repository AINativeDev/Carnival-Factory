/**
 * The still part of every diorama: the dusk sky with its stars, the snowy
 * ridges and hills behind, and the slab of snow the scene stands on. It never
 * moves, so in a square's worker it is drawn once for each size and copied in
 * every frame after that. Like the rest of the diorama, it imports nothing but
 * `./theme` and the diorama's own parts, since every booth may import it.
 */
import { box, diamond, GROUND, iso } from './diorama-ground';
import { theme } from './theme';

const { colors } = theme;

// The far ridges, worked out once: [x, height] along each.
const RIDGES = [
  { base: 50, color: colors.mountainFar, peaks: [10, 18, 9, 22, 13, 20, 8, 16, 11] },
  { base: 56, color: colors.mountain, peaks: [8, 14, 6, 17, 10, 15, 7, 12, 9, 13] },
];
const STARS: readonly (readonly [number, number])[] = [
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
/** A few drifts on the slab for texture: where each is, and how wide. */
const DRIFTS: readonly (readonly [number, number, number])[] = [
  [-16, 12, 5],
  [14, -15, 4],
  [17, 16, 3],
];

/** The two far ridges, with snow on each peak that stands above its neighbours, lit on its left. */
function ridges(ctx: CanvasRenderingContext2D) {
  for (const { base, color, peaks } of RIDGES) {
    const step = 100 / (peaks.length - 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 100);
    peaks.forEach((peak, n) => {
      ctx.lineTo(n * step, base - peak);
    });
    ctx.lineTo(100, 100);
    ctx.fill();
    ctx.fillStyle = colors.snowShade;
    ctx.globalAlpha = 0.7;
    peaks.forEach((peak, n) => {
      // Stryker disable next-line EqualityOperator: no two neighbouring peaks are the same height
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
}

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
  ridges(ctx);
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
function slab(ctx: CanvasRenderingContext2D) {
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
  ctx.fillStyle = colors.snowShade;
  ctx.globalAlpha = 0.5;
  for (const [gx, gy, w] of DRIFTS) {
    const p = iso(gx, gy);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, w, w / 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** The backdrop and the slab drawn once for the last size asked for, in a square's worker. */
let still: { size: number; canvas: OffscreenCanvas } | undefined;

/**
 * Paints the backdrop and the slab in 0 to 100 units: from the copy kept for
 * this size where the worker has an OffscreenCanvas, else drawn afresh.
 */
export function backdropAndSlab(ctx: CanvasRenderingContext2D, size: number) {
  if (typeof OffscreenCanvas === 'undefined') {
    backdrop(ctx);
    slab(ctx);
    return;
  }
  if (still?.size !== size) {
    const canvas = new OffscreenCanvas(size, size);
    const layer = canvas.getContext('2d');
    if (!layer) {
      backdrop(ctx);
      slab(ctx);
      return;
    }
    layer.scale(size / 100, size / 100);
    backdrop(layer as unknown as CanvasRenderingContext2D);
    slab(layer as unknown as CanvasRenderingContext2D);
    still = { size, canvas };
  }
  ctx.drawImage(still.canvas, 0, 0, 100, 100);
}
