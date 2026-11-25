import { box, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long a note takes to rise from the headphones and fade, in milliseconds. */
export const NOTE = 2_000;

/** How far note `n` has risen at `time`, from 0 (at the ear) to 1 (gone): three notes in turn. */
export function noteAt(time: number, n: number): number {
  return (((time / NOTE + n / 3) % 1) + 1) % 1;
}

/** The Headphones: a pair on a stand, their cable curling away, and the sound rising out of them as notes. */
const headphones: NorthPoleSquare = {
  id: 'headphones',
  name: 'Headphones',
  description:
    'Everyone in the booth wears a pair, to hear each other clearly and keep the sound clean.',
  stall: { shape: 'kiosk', roof: 'gold', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 36);
      // The stand: a round foot and a post.
      box(ctx, -5, -5, 10, 10, 2, colors.ink, colors.ink, colors.shadow);
      box(ctx, -1, -1, 2, 2, 22, colors.slabShade, colors.slab, colors.slabShade, 2);
      // The band over the top, and the two ear cups hanging either side.
      const top = iso(0, 0, 30);
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(top.x, top.y + 6, 9, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      for (const side of [-1, 1]) {
        ctx.fillStyle = colors.ink;
        ctx.beginPath();
        ctx.ellipse(top.x + side * 9, top.y + 9, 3.4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colors.berry;
        ctx.beginPath();
        ctx.ellipse(top.x + side * 9.6, top.y + 9, 2, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // The cable, curling down to the floor.
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(top.x + 9, top.y + 14);
      ctx.bezierCurveTo(top.x + 16, top.y + 24, top.x + 4, top.y + 30, top.x + 14, foot.y + 4);
      ctx.stroke();
      // The sound rising out of them, as notes that drift up and fade.
      ctx.fillStyle = colors.gold;
      for (let n = 0; n < 3; n++) {
        const rise = noteAt(time, n);
        ctx.globalAlpha = 1 - rise;
        const x = top.x + (n - 1) * 10 + Math.sin(rise * 6) * 2;
        const y = top.y - 2 - rise * 18;
        ctx.beginPath();
        ctx.ellipse(x, y, 1.6, 1.2, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + 1, y - 6, 0.6, 6);
      }
      ctx.globalAlpha = 1;
    });
  },
};

export default headphones;
