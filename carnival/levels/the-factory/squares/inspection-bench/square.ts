import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long one round of inspection takes, in milliseconds. */
export const ROUND = 7_000;

/** The checks on the board: the lint, the types, the tests, the browser, and the review. */
export const CHECKS = 5;

/**
 * How many checks show green at `time`: the lens passes over the booth and
 * each check lights in turn, a beat with them all lit, then a new round.
 */
export function checksPassed(time: number): number {
  const beat = ((time % ROUND) + ROUND) % ROUND;
  return Math.min(CHECKS, Math.floor((beat / ROUND) * (CHECKS + 1)));
}

/** The inspection bench: a magnifying lens sweeps over a booth while the checks light up one by one. */
const inspectionBench: NorthPoleSquare = {
  id: 'inspection-bench',
  name: 'Inspection',
  description: 'Review lenses and checks look the booth over, and the fixes go in.',
  stall: { shape: 'shed', roof: 'mint', trim: 'snow' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 44);
      box(ctx, -16, -6, 32, 14, 10, colors.snowShade, colors.slab, colors.slabShade);
      box(ctx, -6, -2, 10, 8, 10, colors.snow, colors.berry, colors.cocoa, 10);
      // The board of checks behind the bench.
      box(ctx, -18, -14, 36, 2, 26, colors.surface, colors.surface, colors.night);
      const passed = checksPassed(time);
      for (let n = 0; n < CHECKS; n++) {
        const light = iso(-14 + n * 7, -14, 18);
        ctx.fillStyle = n < passed ? colors.aurora : colors.muted;
        ctx.beginPath();
        ctx.arc(light.x, light.y, 2, 0, Math.PI * 2);
        ctx.fill();
        if (n < passed) glow(ctx, light.x, light.y, 5, 0.5);
      }
      // The lens, sweeping to and fro over the booth on the bench.
      const sweep = iso(-1 + Math.sin(time / 900) * 6, 2, 26);
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sweep.x, sweep.y, 6, 0, Math.PI * 2);
      ctx.moveTo(sweep.x + 4.2, sweep.y + 4.2);
      ctx.lineTo(sweep.x + 9, sweep.y + 9);
      ctx.stroke();
      ctx.fillStyle = colors.ice;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(sweep.x, sweep.y, 5.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  },
};

export default inspectionBench;
