/**
 * The scenery the run rushes through: the dusk sky and far mountains, and the
 * snowy slope with its track and pines, which scroll with the run's distance
 * so the slope seems to rush towards you.
 */
import { theme } from '../../../src/northpole/theme';
import { TRACK, wrap } from './course';
import { blob, type Ctx, HORIZON, project, VIEW } from './view';

const { colors } = theme;

/** The dusk sky above the horizon: a low warm sun, drifting clouds and the mountains. */
export function sky(ctx: Ctx, time: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, colors.dusk);
  g.addColorStop(0.6, colors.duskLow);
  g.addColorStop(1, colors.horizon);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 100, HORIZON + 1);

  // A low, warm sun, and soft clouds that drift.
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = colors.lantern;
  blob(ctx, 72, HORIZON - 3, 14, 11);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.glow;
  blob(ctx, 72, HORIZON - 3, 6, 6);
  ctx.fillStyle = colors.cloud;
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 3; i++) {
    const x = wrap(i * 40 + time / 900, 140) - 20;
    blob(ctx, x, 8 + i * 6, 11, 2.6);
    blob(ctx, x + 5, 6.5 + i * 6, 6, 2.4);
  }
  ctx.globalAlpha = 1;

  // Far mountains, with the run's own mountain behind.
  ctx.fillStyle = colors.mountainFar;
  ctx.beginPath();
  ctx.moveTo(0, HORIZON);
  ctx.lineTo(0, 27);
  ctx.quadraticCurveTo(14, 16, 28, 29);
  ctx.quadraticCurveTo(40, 21, 55, 30);
  ctx.quadraticCurveTo(75, 14, 100, 28);
  ctx.lineTo(100, HORIZON);
  ctx.fill();
  ctx.fillStyle = colors.mountain;
  ctx.beginPath();
  ctx.moveTo(0, HORIZON);
  ctx.quadraticCurveTo(25, 28, 45, 34);
  ctx.quadraticCurveTo(70, 26, 100, HORIZON);
  ctx.fill();
}

/** The slope below the horizon, `here` metres down the run, with the camera turned to `camera`. */
export function slope(ctx: Ctx, camera: number, here: number): void {
  // The snowy hillside either side of the track.
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(0, HORIZON, 100, 100 - HORIZON);

  // Soft bands of light and shade rushing towards you.
  for (let i = 0; i < 30; i++) {
    const ahead0 = i * 2.4 - wrap(here, 2.4) + 0.001;
    const ahead1 = ahead0 + 1.2;
    if (ahead1 <= 0) continue;
    const a = project(0, Math.max(0, ahead0), 0);
    const b = project(0, ahead1, 0);
    ctx.fillStyle = colors.snowLit;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(0, b.y, 100, a.y - b.y);
  }
  ctx.globalAlpha = 1;

  // The track: a paler ribbon of snow, curving with the camera.
  const near = project(0, 0, camera);
  const far = project(0, VIEW, camera);
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.moveTo(near.x - TRACK * 36, near.y);
  ctx.lineTo(far.x - TRACK * 36 * far.k, far.y);
  ctx.lineTo(far.x + TRACK * 36 * far.k, far.y);
  ctx.lineTo(near.x + TRACK * 36, near.y);
  ctx.fill();
  ctx.fillStyle = colors.slab;
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(near.x + sign * TRACK * 36, near.y);
    ctx.lineTo(far.x + sign * TRACK * 36 * far.k, far.y);
    ctx.lineTo(far.x + sign * (TRACK * 36 * far.k + 0.4), far.y);
    ctx.lineTo(near.x + sign * (TRACK * 36 + 3), near.y);
    ctx.fill();
  }

  // Snow-capped pines along both edges.
  for (let i = 0; i < 12; i++) {
    const ahead = i * 6 - wrap(here, 6) + 6;
    if (ahead < 0.6 || ahead > VIEW) continue;
    for (const sign of [-1, 1]) {
      const p = project(sign * 2.3, ahead, camera);
      const h = 22 * p.k;
      const w = 7 * p.k;
      ctx.fillStyle = colors.pineDark;
      ctx.beginPath();
      ctx.moveTo(p.x - w, p.y);
      ctx.lineTo(p.x + w, p.y);
      ctx.lineTo(p.x, p.y - h);
      ctx.fill();
      ctx.fillStyle = colors.snow;
      ctx.beginPath();
      ctx.moveTo(p.x - w * 0.45, p.y - h * 0.55);
      ctx.lineTo(p.x + w * 0.45, p.y - h * 0.55);
      ctx.lineTo(p.x, p.y - h);
      ctx.fill();
    }
  }
}
