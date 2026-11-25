import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long one letter takes to fly into the box, in milliseconds. */
export const FLIGHT = 3_000;

/**
 * How far letter `n` is on its way into the box at `time`, from 0 (just
 * posted, low on the left) to 1 (in the slot). Three letters fly in turn.
 */
export function letterAt(time: number, n: number): number {
  return (((time / FLIGHT + n / 3) % 1) + 1) % 1;
}

/** An envelope, `w` wide, its flap folded down to a point. */
function envelope(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const h = w * 0.62;
  ctx.fillStyle = colors.cream;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.lineTo(x, y + h * 0.1);
  ctx.lineTo(x + w / 2, y - h / 2);
  ctx.stroke();
}

/** The letter box: a red post box on the snow, letters with wishes flying into its slot. */
const letterBox: NorthPoleSquare = {
  id: 'letter-box',
  name: 'The Letter Box',
  description: 'Every booth starts here, as a letter: a booth request filed on GitHub.',
  stall: { shape: 'kiosk', roof: 'berry', trim: 'snow' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 26);
      box(ctx, -6, -6, 12, 12, 30, colors.berry, colors.berry, colors.cocoa);
      // Its domed cap and the brass slot, lit by a lamp beside it.
      box(ctx, -7, -7, 14, 14, 3, colors.gold, colors.gold, colors.gingerbread, 30);
      const slot = iso(-6, 0, 22);
      ctx.fillStyle = colors.ink;
      ctx.fillRect(slot.x - 5, slot.y - 1, 10, 2);
      const lamp = iso(-14, 8, 26);
      glow(ctx, lamp.x, lamp.y, 18, 0.8 + 0.2 * Math.sin(time / 700));
      box(ctx, -15, 7, 2, 2, 24, colors.ink, colors.ink, colors.shadow);
      for (let n = 0; n < 3; n++) {
        const t = letterAt(time, n);
        const from = iso(-22, 14, 6);
        const x = from.x + (slot.x - from.x) * t;
        const y = from.y + (slot.y - from.y) * t - Math.sin(t * Math.PI) * 14;
        ctx.globalAlpha = Math.min(1, (1 - t) * 4);
        envelope(ctx, x, y, 7 - t * 3);
        ctx.globalAlpha = 1;
      }
    });
  },
};

export default letterBox;
