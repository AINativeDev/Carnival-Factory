import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long one round of tuning takes, from a wobbly score to a settled one, in milliseconds. */
export const TUNE = 6_000;

/** Where the gauge's needle may point, in radians from straight up: from the red end to the green. */
export const NEEDLE = { low: -1.2, high: 1.1 };

/**
 * Where the gauge's needle points at `time`: it wobbles low at first, then
 * climbs as the dials are turned, and rests in the green before a new round.
 */
export function needleAt(time: number): number {
  const phase = (((time / TUNE) % 1) + 1) % 1;
  const climb = Math.min(1, phase / 0.7);
  const wobble = Math.sin(time / 120) * 0.15 * (1 - climb);
  return NEEDLE.low + (NEEDLE.high - NEEDLE.low) * climb + wobble;
}

/** Tuning Your Agent: a console of dials turning, and a gauge whose needle climbs into the green. */
const tuningYourAgent: NorthPoleSquare = {
  id: 'tuning-your-agent',
  name: 'Tuning Your Agent',
  description:
    'Measure how well your agent does with evals, then improve your skills on purpose rather than by guesswork.',
  stall: { shape: 'kiosk', roof: 'violet', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 46);
      // The console, and three dials on its top, each turning at its own pace.
      box(ctx, -18, -4, 30, 12, 10, colors.surface, colors.slab, colors.slabShade);
      for (let n = 0; n < 3; n++) {
        const dial = iso(-13 + n * 9, 2, 10);
        ctx.fillStyle = colors.ink;
        ctx.beginPath();
        ctx.ellipse(dial.x, dial.y, 3.4, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        const turn = time / (700 + n * 300);
        ctx.strokeStyle = colors.gold;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(dial.x, dial.y);
        ctx.lineTo(dial.x + Math.cos(turn) * 3, dial.y + Math.sin(turn) * 1.6);
        ctx.stroke();
      }
      // The gauge on its post: red, gold and green bands, and the needle.
      box(ctx, 12, -14, 3, 3, 18, colors.slab, colors.slab, colors.slabShade);
      const centre = iso(13.5, -12.5, 24);
      glow(ctx, centre.x, centre.y, 14, 0.5);
      const bands = [colors.berry, colors.gold, colors.aurora];
      bands.forEach((colour, n) => {
        const from = -Math.PI / 2 + NEEDLE.low + ((NEEDLE.high - NEEDLE.low) * n) / 3;
        const to = from + (NEEDLE.high - NEEDLE.low) / 3;
        ctx.strokeStyle = colour;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(centre.x, centre.y, 8, from, to);
        ctx.stroke();
      });
      const needle = needleAt(time);
      ctx.strokeStyle = colors.snow;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(centre.x, centre.y);
      ctx.lineTo(centre.x + Math.sin(needle) * 7, centre.y - Math.cos(needle) * 7);
      ctx.stroke();
    });
  },
};

export default tuningYourAgent;
