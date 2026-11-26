/**
 * Falling snow that streaks past the camera faster as the van speeds up, the
 * puff of snow when a run ends, and the sparkles when a parcel lands.
 */
import { chance } from './game';
import { circle, colors, type Ctx } from './brushes';

const FLAKES = 60;

/** Where flake `index` is, from 0 to 1 across and down, and how long its streak is, at a point in the run. */
export function flakeAt(index: number, time: number, dist: number, speed: number) {
  const fall = 0.00018 * (0.6 + chance(2, index)) * time;
  const rush = dist * 0.0009 * (0.5 + chance(6, index));
  const y = (chance(1, index) + fall + rush) % 1;
  return { x: chance(7, index), y, streak: (speed / 34) * 0.05 };
}

/** Every flake, as a dot at rest and a short streak at speed. */
export function drawSnowfall(ctx: Ctx, size: number, time: number, dist: number, speed: number) {
  ctx.strokeStyle = colors.snow;
  ctx.fillStyle = colors.snow;
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < FLAKES; i += 1) {
    const flake = flakeAt(i, time, dist, speed);
    const x = flake.x * size;
    const y = flake.y * size;
    ctx.lineWidth = size * 0.004;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + (x - size / 2) * flake.streak * 0.3,
      y + flake.streak * size * 0.6 + size * 0.004,
    );
    ctx.stroke();
    circle(ctx, x, y, size * 0.004);
  }
  ctx.globalAlpha = 1;
}

/** The soft puff of snow when the van spins out, `seconds` after the crash. */
export function drawPuff(ctx: Ctx, x: number, y: number, size: number, seconds: number) {
  const grow = Math.min(1, seconds / 1.2);
  ctx.fillStyle = colors.snow;
  for (let i = 0; i < 9; i += 1) {
    const angle = (i / 9) * Math.PI * 2;
    ctx.globalAlpha = 0.85 * (1 - grow * 0.7);
    circle(
      ctx,
      x + Math.cos(angle) * grow * size * 0.12,
      y - size * 0.05 + Math.sin(angle) * grow * size * 0.05,
      size * (0.03 + grow * 0.03),
    );
  }
  ctx.globalAlpha = 1;
}

/** The sparkle burst over the van, `age` seconds after a parcel landed. */
export function drawSparkles(ctx: Ctx, x: number, y: number, size: number, age: number) {
  ctx.fillStyle = colors.glow;
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.globalAlpha = Math.max(0, 1 - age / 0.7);
    circle(
      ctx,
      x + Math.cos(angle) * age * size * 0.25,
      y + Math.sin(angle) * age * size * 0.25,
      size * 0.012,
    );
  }
  ctx.globalAlpha = 1;
}
