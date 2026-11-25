import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the quill takes to write one line, in milliseconds. */
export const LINE = 2_400;

/** The lines on the guestbook's open page. */
export const LINES = 4;

/**
 * Where the quill is at `time`: which line of the page it's writing, and how
 * far along it, from 0 to 1. It writes each line in turn, then starts again.
 */
export function quillAt(time: number): { line: number; along: number } {
  const written = (((time / LINE) % LINES) + LINES) % LINES;
  return { line: Math.floor(written), along: written % 1 };
}

/**
 * Your questions: the gallery's reception desk, with the guestbook open on it
 * and a quill writing visitors' own questions in it, line by line, under a
 * warm desk lamp.
 */
const square: NorthPoleSquare = {
  id: 'your-questions',
  name: 'Your questions',
  description:
    'The guestbook: questions visitors asked of their own, with their answers. Ask yours with Add your answer.',
  stall: { shape: 'kiosk', roof: 'gold', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 44);
      // The reception desk, and the guestbook open on it.
      box(ctx, -16, -8, 32, 14, 14, colors.wood, colors.gingerbread, colors.cocoa);
      box(ctx, -9, -5, 18, 9, 1, colors.cream, colors.cream, colors.snowShade, 14);
      ctx.strokeStyle = colors.slabShade;
      ctx.beginPath();
      const spineTop = iso(0, -5, 15);
      const spineFoot = iso(0, 4, 15);
      ctx.moveTo(spineTop.x, spineTop.y);
      ctx.lineTo(spineFoot.x, spineFoot.y);
      ctx.stroke();
      // The lines written so far, and the quill writing the next.
      const { line, along } = quillAt(time);
      ctx.strokeStyle = colors.ink;
      ctx.beginPath();
      for (let n = 0; n <= line; n++) {
        const length = n < line ? 7 : 7 * along;
        const from = iso(1.5, -3.5 + n * 2, 15);
        const to = iso(1.5 + length, -3.5 + n * 2, 15);
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
      }
      ctx.stroke();
      const tip = iso(1.5 + 7 * along, -3.5 + line * 2, 15);
      ctx.strokeStyle = colors.snow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x + 6, tip.y - 12);
      ctx.stroke();
      ctx.lineWidth = 1;
      // The desk lamp, its warm pool on the page.
      const lamp = iso(-12, -6, 26);
      glow(ctx, lamp.x + 6, lamp.y + 10, 22, 0.8);
      ctx.fillStyle = colors.pine;
      ctx.fillRect(lamp.x - 0.8, lamp.y, 1.6, 12);
      ctx.beginPath();
      ctx.moveTo(lamp.x - 5, lamp.y + 3);
      ctx.lineTo(lamp.x + 5, lamp.y + 3);
      ctx.lineTo(lamp.x, lamp.y - 3);
      ctx.fill();
    });
  },
};

export default square;
