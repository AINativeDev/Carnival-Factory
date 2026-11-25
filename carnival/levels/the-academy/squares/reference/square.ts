import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long each book stays out on the shelf before the next one is looked up, in milliseconds. */
export const LOOKUP = 1_600;

/** The books along each shelf, by their spines' colours. */
export const SPINES = [
  colors.berry,
  colors.pine,
  colors.gold,
  colors.violet,
  colors.ice,
  colors.gingerbread,
];

/** The shelves, bottom to top. */
export const SHELVES = 3;

/**
 * Which book is pulled out at `time`, counting along the shelves from the
 * bottom left: one after another, all the way up, then round again.
 */
export function bookOut(time: number): number {
  const all = SPINES.length * SHELVES;
  return ((Math.floor(time / LOOKUP) % all) + all) % all;
}

/** Reference: a library shelf of books, one sliding out to be looked up in turn, under a reading lamp. */
const reference: NorthPoleSquare = {
  id: 'reference',
  name: 'Reference',
  description:
    'The words to know, what goes in a skill file and how a coding agent works, for whenever you need to look something up.',
  stall: { shape: 'kiosk', roof: 'berry', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 46);
      // The bookcase against the back, its shelves, and the books on them.
      box(ctx, -18, -12, 34, 8, 34, colors.wood, colors.gingerbread, colors.cocoa);
      const out = bookOut(time);
      for (let shelf = 0; shelf < SHELVES; shelf++) {
        SPINES.forEach((spine, n) => {
          const pulled = shelf * SPINES.length + n === out;
          const gy = -4 + (pulled ? 3 : 0);
          const tall = 7 + ((n * 3 + shelf) % 3);
          box(ctx, -16 + n * 5, gy - 1, 4, 1, tall, spine, spine, colors.cocoa, 2 + shelf * 11);
        });
      }
      // A reading desk in front, an open book on it, and the lamp over it.
      box(ctx, -8, 6, 16, 8, 8, colors.wood, colors.gingerbread, colors.cocoa);
      box(ctx, -5, 8, 10, 5, 0.6, colors.cream, colors.cream, colors.snowShade, 8);
      const lamp = iso(6, 8, 16);
      glow(ctx, lamp.x, lamp.y, 14, 0.8);
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  },
};

export default reference;
