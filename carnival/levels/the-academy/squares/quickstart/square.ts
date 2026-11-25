import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long one dash down the track takes, from the starting line and back again, in milliseconds. */
export const DASH = 4_000;

/**
 * How far the little runner is down the track at `time`, from 0 (on the
 * starting line) to 1 (over the finish): a short wait on the line, then off.
 */
export function dashAt(time: number): number {
  const phase = (((time / DASH) % 1) + 1) % 1;
  return Math.max(0, Math.min(1, (phase - 0.25) / 0.6));
}

/** Where the stopwatch's hand points at `time`, in radians from twelve o'clock: once round per dash. */
export const handAt = (time: number) => ((((time / DASH) % 1) + 1) % 1) * Math.PI * 2;

/** Quickstart: a running track with a starting line, a little runner dashing off, and a stopwatch ticking. */
const quickstart: NorthPoleSquare = {
  id: 'quickstart',
  name: 'Quickstart',
  description:
    'Install Tessl in a fresh project and get your agent going with it in a few minutes.',
  stall: { shape: 'kiosk', roof: 'berry', trim: 'snow' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 48);
      // The track, the starting line across it and the gold finish at the far end.
      box(ctx, -20, -6, 40, 12, 2, colors.berry, colors.cocoa, colors.cocoa);
      for (let n = 0; n < 4; n++)
        box(ctx, -16, -6 + n * 3, 1.5, 1.5, 0.3, colors.snow, colors.snow, colors.snow, 2);
      box(ctx, 16, -6, 1.5, 12, 0.3, colors.gold, colors.gold, colors.gold, 2);
      // The runner: a little elf in a green coat, off the line once the wait is over.
      const along = -14 + dashAt(time) * 28;
      const hop = Math.abs(Math.sin(time / 90)) * (dashAt(time) > 0 ? 2 : 0);
      box(ctx, along, -1, 3, 3, 5, colors.pine, colors.pine, colors.pineDark, 2 + hop);
      const head = iso(along + 1.5, 0.5, 9.5 + hop);
      ctx.fillStyle = colors.snowLit;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
      // The stopwatch on its stand behind the track, its hand going round.
      box(ctx, -2, -16, 4, 4, 14, colors.slab, colors.slab, colors.slabShade);
      const face = iso(0, -14, 26);
      glow(ctx, face.x, face.y, 12, 0.6);
      ctx.fillStyle = colors.cream;
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(face.x, face.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = colors.ink;
      ctx.fillRect(face.x - 1, face.y - 9.5, 2, 2.5);
      const hand = handAt(time);
      ctx.strokeStyle = colors.berry;
      ctx.beginPath();
      ctx.moveTo(face.x, face.y);
      ctx.lineTo(face.x + Math.sin(hand) * 5.5, face.y - Math.cos(hand) * 5.5);
      ctx.stroke();
    });
  },
};

export default quickstart;
