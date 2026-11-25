/**
 * The sky over the North Pole, in screen pixels: the dusk gradient, the
 * mountains and hills on the horizon, drifting clouds, the northern lights and
 * the falling snow. The map draws the still ones once to their own layers and
 * the moving ones every frame.
 */
import { theme } from './theme';
import { sidesOf } from './rounds';
import { hash, type Tile } from './world';

const { colors } = theme;

/** Snow falling over the whole view, in screen pixels. */
export function drawSnowfall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  ctx.fillStyle = colors.snow;
  const flakes = Math.round((width * height) / 7000);
  for (let n = 0; n < flakes; n++) {
    const speed = 0.02 + 0.03 * hash(n, 20);
    const fall = (hash(n, 21) * height + time * speed) % (height + 20);
    const sway = Math.sin(time / 1500 + n) * 12;
    ctx.globalAlpha = 0.5 + 0.4 * hash(n, 22);
    ctx.beginPath();
    ctx.arc(hash(n, 23) * width + sway, fall - 10, 1 + 1.6 * hash(n, 24), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * The northern lights rippling across the top of the sky, in screen pixels:
 * bright against the night, and a faint glow, `strength` 0 to 1, over the snow.
 */
export function drawAurora(
  ctx: CanvasRenderingContext2D,
  width: number,
  time: number,
  strength = 1,
) {
  ctx.save();
  if (strength >= 1) ctx.globalCompositeOperation = 'lighter';
  for (const [n, color] of [colors.aurora, colors.violet, colors.mint].entries()) {
    ctx.globalAlpha = 0.12 * strength;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= width; x += 24) {
      const wave = Math.sin(x / (160 + n * 40) + time / (3000 + n * 900) + n * 2);
      ctx.lineTo(x, 90 + n * 22 + wave * 30);
    }
    ctx.lineTo(width, 0);
    ctx.fill();
  }
  ctx.restore();
}

/** The dusk sky, drawn once to its own layer: deep blue overhead, warm at the horizon. In screen pixels. */
export function drawSky(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, colors.night);
  sky.addColorStop(0.35, colors.dusk);
  sky.addColorStop(0.62, colors.duskLow);
  sky.addColorStop(0.78, colors.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
}

/** The mountains and hills on the horizon, drawn once to their own layer. In screen pixels. */
export function drawMountains(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const ridge = (base: number, peak: number, step: number, seed: number, color: string) => {
    const points: Tile[] = [];
    for (let x = -step, n = 0; x <= width + step; x += step, n++)
      points.push({ x, y: base - peak * (0.35 + 0.65 * hash(n, seed)) });
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.lineTo(width, height);
    ctx.fill();
    snowCaps(ctx, points, step);
  };
  ridge(height * 0.62, height * 0.3, Math.max(80, width / 9), 31, colors.mountainFar);
  ridge(height * 0.7, height * 0.22, Math.max(60, width / 13), 32, colors.mountain);
  // Rolling snowy hills, nearer.
  ctx.fillStyle = colors.hill;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 20; x += 20)
    ctx.lineTo(x, height * 0.78 + Math.sin(x / 140) * 16 + Math.sin(x / 57 + 1) * 6);
  ctx.lineTo(width, height);
  ctx.fill();
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 20; x += 20)
    ctx.lineTo(x, height * 0.86 + Math.sin(x / 190 + 2) * 14);
  ctx.lineTo(width, height);
  ctx.fill();
}

/** Clouds drifting slowly across the sky, in screen pixels. */
export function drawClouds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  ctx.fillStyle = colors.cloud;
  for (let n = 0; n < 6; n++) {
    const speed = 0.004 + 0.004 * hash(n, 40);
    const span = width + 320;
    const x = ((hash(n, 41) * span + time * speed) % span) - 160;
    const y = height * (0.12 + 0.3 * hash(n, 42));
    const size = 30 + 30 * hash(n, 43);
    ctx.globalAlpha = 0.28 + 0.2 * hash(n, 44);
    ctx.beginPath();
    ctx.ellipse(x, y, size * 2.2, size * 0.5, 0, 0, Math.PI * 2);
    ctx.ellipse(x - size * 0.6, y - size * 0.3, size * 0.9, size * 0.55, 0, 0, Math.PI * 2);
    ctx.ellipse(x + size * 0.5, y - size * 0.4, size, size * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Snow on every peak of a ridge: each point no lower than the points either side of it. */
function snowCaps(ctx: CanvasRenderingContext2D, points: Tile[], step: number) {
  ctx.fillStyle = colors.snow;
  ctx.globalAlpha = 0.85;
  // Each point with its neighbours: the ridge's steps, then each pair of steps in a row.
  const steps = sidesOf(points).slice(0, -1);
  for (const { p: before, q: after } of sidesOf(steps).slice(0, -1)) {
    const [left, p, right] = [before.p, before.q, after.q];
    if (p.y > left.y || p.y > right.y) continue;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + (left.x - p.x) * 0.3, p.y + (left.y - p.y) * 0.3);
    ctx.lineTo(p.x - step * 0.05, p.y + (left.y - p.y) * 0.18);
    ctx.lineTo(p.x + (right.x - p.x) * 0.3, p.y + (right.y - p.y) * 0.3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
