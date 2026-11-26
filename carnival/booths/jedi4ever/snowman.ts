/**
 * The waving snowman: a small snowman in a red scarf who stands at the
 * roadside now and then along the run and waves as the van goes by.
 */
import { chance } from './game';
import { circle, colors, polygon, type Ctx } from './brushes';
import type { Roadside } from './street';
import { FAR, project } from './view';

/** Metres between the places a snowman might stand. */
export const SNOWMAN_GAP = 90;
/** How far ahead of the van, in metres, a snowman starts waving. */
export const WAVE_REACH = 30;
/** Across the road, in road-widths: out on the snowbank, past the lamps. */
const VERGE = 1.38;

/** Whether the `index`th place has a snowman, and which side of the road he stands on. */
export function snowmanAt(index: number): { side: -1 | 1 } | undefined {
  if (chance(31, index) < 0.35) return undefined;
  return { side: chance(37, index) < 0.5 ? -1 : 1 };
}

/** How far the waving arm is raised, in radians, `ahead` metres in front of the van: still unless it is near. */
export function waveAngle(ahead: number, time: number): number {
  if (ahead < -2 || ahead > WAVE_REACH) return 0;
  return 0.9 + 0.5 * Math.sin(time * 9);
}

/** One snowman: three snowballs, a coal face, a carrot nose, a red scarf and a waving twig arm. */
function snowman(size: number, d: number, side: number, dist: number, time: number): Roadside {
  const at = project(size, d, side * VERGE, dist);
  const u = at.scale * size * 0.1;
  const wave = waveAngle(d - 7, time);
  return {
    d,
    paint(ctx: Ctx) {
      ctx.fillStyle = colors.shadow;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.ellipse(at.x, at.y, u * 1.1, u * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // The arm on the van's side lifts and swings; the other hangs.
      ctx.strokeStyle = colors.wood;
      ctx.lineWidth = Math.max(size * 0.002, u * 0.12);
      ctx.lineCap = 'round';
      const shoulderY = at.y - u * 1.9;
      for (const arm of [-1, 1]) {
        const raised = arm === -side ? wave : -0.5;
        ctx.beginPath();
        ctx.moveTo(at.x + arm * u * 0.5, shoulderY);
        ctx.lineTo(
          at.x + arm * (u * 0.5 + Math.cos(raised) * u * 0.9),
          shoulderY - Math.sin(raised) * u * 0.9,
        );
        ctx.stroke();
      }
      ctx.fillStyle = colors.snowShade;
      circle(ctx, at.x, at.y - u * 0.55, u * 0.75);
      ctx.fillStyle = colors.snow;
      circle(ctx, at.x, at.y - u * 1.6, u * 0.55);
      circle(ctx, at.x, at.y - u * 2.45, u * 0.4);
      ctx.fillStyle = colors.berry;
      ctx.fillRect(at.x - u * 0.42, at.y - u * 2.1, u * 0.84, u * 0.2);
      ctx.fillRect(at.x + u * 0.1, at.y - u * 2.1, u * 0.2, u * 0.55);
      ctx.fillStyle = colors.ink;
      circle(ctx, at.x - u * 0.15, at.y - u * 2.55, u * 0.05);
      circle(ctx, at.x + u * 0.15, at.y - u * 2.55, u * 0.05);
      polygon(
        ctx,
        [
          [at.x, at.y - u * 2.45],
          [at.x + u * 0.3, at.y - u * 2.4],
          [at.x, at.y - u * 2.35],
        ],
        colors.gingerbread,
      );
    },
  };
}

/** Every snowman in view, far and near. */
export function snowmen(size: number, dist: number, time: number): Roadside[] {
  const found: Roadside[] = [];
  const first = Math.floor(dist / SNOWMAN_GAP);
  for (let i = first; i < first + FAR / SNOWMAN_GAP + 2; i += 1) {
    const stand = snowmanAt(i);
    const d = i * SNOWMAN_GAP + 45 - dist;
    if (stand && d >= 1 && d <= FAR) found.push(snowman(size, d, stand.side, dist, time));
  }
  return found;
}
