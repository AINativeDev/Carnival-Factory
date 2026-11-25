import { box, glow, iso, scene } from '../../../../../northpole/diorama';
import type { NorthPoleSquare } from '../../../../../northpole/square';
import { theme } from '../../../../../northpole/theme';

const { colors } = theme;

/** How high a curl of steam is above its cup at `time`, from 0 to 1, rising and starting again. */
export function steamAt(time: number, n: number): number {
  return (((time / 2400 + n / 3) % 1) + 1) % 1;
}

/** A warm hut with a pot of cocoa on the counter, steam curling up from its cups. */
const cocoaHut: NorthPoleSquare = {
  id: 'cocoa-hut',
  name: 'Cocoa Hut',
  description: 'A warm hut by the lake, pouring hot cocoa for frozen skaters.',
  stall: { shape: 'cabin', roof: 'gingerbread', trim: 'cream' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      box(ctx, -14, -14, 28, 12, 22, colors.snow, colors.gingerbread, colors.wood);
      const pane = iso(-2, -2, 12);
      glow(ctx, pane.x, pane.y, 16, 0.9);
      ctx.fillStyle = colors.glow;
      ctx.fillRect(pane.x - 8, pane.y - 5, 16, 9);
      // The counter, with the pot and three cups.
      box(ctx, -12, 0, 24, 5, 6, colors.cream, colors.wood, colors.cocoa);
      for (let n = 0; n < 3; n++) {
        const cup = iso(-6 + n * 6, 2, 6);
        ctx.fillStyle = n === 1 ? colors.berry : colors.cream;
        ctx.fillRect(cup.x - 2, cup.y - 4, 4, 4);
        const rise = steamAt(time, n);
        ctx.strokeStyle = colors.snow;
        ctx.globalAlpha = 0.7 * (1 - rise);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cup.x, cup.y - 5);
        ctx.quadraticCurveTo(cup.x + 3, cup.y - 5 - rise * 6, cup.x, cup.y - 5 - rise * 12);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
  },
};

export default cocoaHut;
