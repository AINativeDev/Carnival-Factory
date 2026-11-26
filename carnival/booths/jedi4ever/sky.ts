/**
 * The dusk sky over the street: a deep gradient, the first stars, and the
 * skyline of snowy rooftops far ahead, which swings with the road's bends.
 */
import { glow } from '../../../src/northpole/diorama';
import { chance } from './game';
import { circle, colors, polygon, type Ctx } from './brushes';
import { FAR, HORIZON, project } from './view';

const STARS = 16;
const ROOFS = 14;

/** How brightly star `index` shows at `time`: it shimmers slowly, never blinks. */
export function starAt(index: number, time: number): number {
  return 0.55 + 0.35 * Math.sin(time / 1600 + index * 2.1);
}

/** The gradient sky and its stars, down to the horizon. */
export function drawSky(ctx: Ctx, size: number, time: number) {
  const horizon = HORIZON * size;
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, colors.night);
  sky.addColorStop(0.55, colors.dusk);
  sky.addColorStop(1, colors.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, size, horizon + 1);
  ctx.fillStyle = colors.text;
  for (let i = 0; i < STARS; i += 1) {
    ctx.globalAlpha = starAt(i, time);
    circle(ctx, chance(3, i) * size, chance(4, i) * horizon * 0.6, size * 0.004);
  }
  ctx.globalAlpha = 1;
}

/** The far rooftops, with snow on every roof and a few lit windows. */
export function drawSkyline(ctx: Ctx, size: number, dist: number) {
  const centre = project(size, FAR, 0, dist).x - size / 2;
  const base = HORIZON * size + size * 0.01;
  const width = (size * 1.4) / ROOFS;
  for (let i = 0; i < ROOFS; i += 1) {
    const left = i * width - size * 0.2 + centre;
    const high = size * (0.04 + chance(5, i) * 0.06);
    polygon(
      ctx,
      [
        [left, base],
        [left, base - high],
        [left + width, base - high],
        [left + width, base],
      ],
      colors.mountainFar,
    );
    polygon(
      ctx,
      [
        [left - 1, base - high],
        [left + width / 2, base - high - width * 0.45],
        [left + width + 1, base - high],
      ],
      colors.snow,
    );
    ctx.fillStyle = colors.glow;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(left + width * 0.3, base - high * 0.6, width * 0.14, width * 0.14);
    ctx.globalAlpha = 1;
  }
  glow(ctx, size / 2 + centre, base, size * 0.25, 0.5);
}
