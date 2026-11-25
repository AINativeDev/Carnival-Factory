/**
 * The snow globe on the shelf by the front: how its snow swirls and settles
 * after a tap, whether a tap is on it, and drawing it with its tiny reindeer.
 */
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx } from './brushes';
import { ease } from './motion';

const { colors } = theme;

/** How long the snow globe's snow swirls and settles after a tap, in milliseconds. */
export const SWIRL = 4_000;
const GLOBE = { x: 60, y: 75, r: 4.6 } as const;
const FLAKES = 14;

/** How wild the globe's snow is `since` milliseconds after a tap: 1 just tapped, 0 settled. */
export function swirlOf(since: number): number {
  return since >= 0 && since < SWIRL ? 1 - ease(since / SWIRL) : 0;
}

/** Whether `x`, `y` (in hundredths of the square) is on the snow globe. */
export function onGlobe(x: number, y: number): boolean {
  return Math.hypot(x - GLOBE.x, y - GLOBE.y - 1) <= GLOBE.r + 1.5;
}

/** Flake `index` in the globe, as -1 to 1 across and down from its middle, `since` a tap. */
export function globeFlake(index: number, since: number): { x: number; y: number } {
  const wild = swirlOf(since);
  const rest = { x: ((index * 0.37) % 1) * 1.4 - 0.7, y: 0.78 - ((index * 0.13) % 0.12) };
  if (wild === 0) return rest;
  const angle = since / (260 + index * 20) + index * 2.1;
  const radius = (0.25 + ((index * 0.17) % 0.55)) * wild;
  const lift = wild * (0.1 + ((index * 0.29) % 0.7));
  return {
    x: rest.x * (1 - wild) + Math.cos(angle) * radius,
    y: rest.y * (1 - wild) + (Math.sin(angle) * radius * 0.7 - lift + 0.2) * wild,
  };
}

/** The shelf by the front, with the snow globe and its tiny reindeer on it. */
export function drawSnowGlobe(ctx: Ctx, u: number, since: number) {
  const { x, y, r } = GLOBE;
  ctx.fillStyle = colors.wood;
  ctx.fillRect((x - 9) * u, (y + 6.6) * u, 18 * u, 1.4 * u);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect((x - 6) * u, (y + 8) * u, 1 * u, 2 * u);
  ctx.fillRect((x + 5) * u, (y + 8) * u, 1 * u, 2 * u);
  ctx.fillStyle = colors.berry;
  ctx.fillRect((x - 3.8) * u, (y + 4.4) * u, 7.6 * u, 2.2 * u);
  ctx.fillStyle = colors.gold;
  ctx.fillRect((x - 3.8) * u, (y + 4.4) * u, 7.6 * u, 0.5 * u);
  // The glass, glowing softly.
  ctx.globalAlpha = 0.4 + 0.1 * swirlOf(since);
  ctx.fillStyle = colors.glow;
  circle(ctx, x * u, y * u, r * u);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = colors.snow;
  ctx.lineWidth = 0.4 * u;
  ctx.beginPath();
  ctx.arc(x * u, y * u, r * u, 0, Math.PI * 2);
  ctx.stroke();
  // The reindeer: body, legs, head and antlers.
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect((x - 1.6) * u, (y + 1.2) * u, 3 * u, 1.5 * u);
  ctx.fillRect((x - 1.4) * u, (y + 2.7) * u, 0.5 * u, 1.3 * u);
  ctx.fillRect((x + 0.6) * u, (y + 2.7) * u, 0.5 * u, 1.3 * u);
  circle(ctx, (x + 2) * u, (y + 0.2) * u, 0.9 * u);
  ctx.fillRect((x + 1.4) * u, (y + 0.4) * u, 0.7 * u, 1.2 * u);
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 0.3 * u;
  ctx.beginPath();
  ctx.moveTo((x + 2) * u, (y - 0.5) * u);
  ctx.lineTo((x + 1.6) * u, (y - 1.8) * u);
  ctx.moveTo((x + 2.2) * u, (y - 0.5) * u);
  ctx.lineTo((x + 2.8) * u, (y - 1.8) * u);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  circle(ctx, (x + 2.8) * u, (y + 0.4) * u, 0.3 * u);
  // The snow.
  ctx.fillStyle = colors.snow;
  for (let i = 0; i < FLAKES; i++) {
    const flake = globeFlake(i, since);
    circle(ctx, (x + flake.x * (r - 0.8)) * u, (y + flake.y * (r - 0.8)) * u, 0.4 * u);
  }
}
