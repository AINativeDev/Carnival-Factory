/** The neat dashboard along the bottom: score, speed and the best run of this visit. */
import { colors, slab, words, type Ctx } from './brushes';

/** The speed on the dial, in whole kilometres an hour, from metres a second. */
export function dialSpeed(metresPerSecond: number): number {
  return Math.round(metresPerSecond * 3.6);
}

/** Paints the dashboard, and the invitation to go again after a crash. */
export function drawDashboard(
  ctx: Ctx,
  size: number,
  run: { score: number; best: number; speed: number },
  inviting: boolean,
) {
  const top = size * 0.885;
  ctx.globalAlpha = 0.85;
  slab(ctx, size * 0.04, top, size * 0.92, size * 0.095, colors.night);
  ctx.globalAlpha = 1;
  const cells: [string, string][] = [
    ['SCORE', String(run.score)],
    ['SPEED', `${String(dialSpeed(run.speed))} km/h`],
    ['BEST', String(run.best)],
  ];
  cells.forEach(([label, value], index) => {
    const x = size * (0.2 + index * 0.3);
    ctx.fillStyle = colors.muted;
    words(ctx, label, x, top + size * 0.027, size * 0.025, size * 0.2);
    ctx.fillStyle = colors.text;
    words(ctx, value, x, top + size * 0.065, size * 0.045, size * 0.26);
  });
  if (inviting) {
    ctx.globalAlpha = 0.9;
    slab(ctx, size * 0.2, size * 0.5, size * 0.6, size * 0.12, colors.night);
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.glow;
    words(ctx, 'Tap to go again', size / 2, size * 0.56, size * 0.06, size * 0.55);
  }
}
