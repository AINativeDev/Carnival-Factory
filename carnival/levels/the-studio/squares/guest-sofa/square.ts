import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long a wisp of steam takes to rise from the cup and fade, in milliseconds. */
export const STEAM = 2_400;

/** How far wisp `n` has risen at `time`, from 0 (just off the cup) to 1 (gone): three wisps in turn. */
export function steamAt(time: number, n: number): number {
  return (((time / STEAM + n / 3) % 1) + 1) % 1;
}

/** The Guest sofa: a sofa and a low table with a cup of coffee steaming, where guests wait to go on. */
const guestSofa: NorthPoleSquare = {
  id: 'guest-sofa',
  name: 'Guest sofa',
  description: 'Where guests sit with a coffee and talk before they go on air.',
  stall: { shape: 'kiosk', roof: 'pine', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 48);
      // The sofa: its seat, its back and its arms.
      box(ctx, -18, -12, 26, 10, 6, colors.pine, colors.pine, colors.pineDark);
      box(ctx, -18, -14, 26, 3, 14, colors.pine, colors.pine, colors.pineDark);
      box(ctx, -20, -14, 3, 12, 9, colors.pineDark, colors.pine, colors.pineDark);
      box(ctx, 7, -14, 3, 12, 9, colors.pineDark, colors.pine, colors.pineDark);
      box(ctx, -12, -10, 6, 5, 2, colors.gold, colors.gold, colors.gingerbread, 6);
      // The low table, the cup on it, and its steam.
      box(ctx, -8, 4, 16, 10, 5, colors.wood, colors.gingerbread, colors.cocoa);
      box(ctx, -1, 7, 3, 3, 3, colors.cocoa, colors.cream, colors.snowShade, 5);
      for (let n = 0; n < 3; n++) {
        const rise = steamAt(time, n);
        const wisp = iso(0.5 + Math.sin(rise * 6 + n) * 1.2, 8.5, 10 + rise * 14);
        ctx.fillStyle = colors.cloud;
        ctx.globalAlpha = 0.6 * (1 - rise);
        ctx.beginPath();
        ctx.arc(wisp.x, wisp.y, 1.2 + rise * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // A warm lamp in the corner.
      box(ctx, 14, -12, 1, 1, 22, colors.ink, colors.ink, colors.shadow);
      const lamp = iso(14.5, -11.5, 24);
      glow(ctx, lamp.x, lamp.y, 14, 0.9);
      ctx.fillStyle = colors.lantern;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
  },
};

export default guestSofa;
