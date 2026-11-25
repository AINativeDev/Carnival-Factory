import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the workshop takes to build one little booth, in milliseconds. */
export const BUILD = 6_000;

/** The parts of the little booth on the bench, laid in order: floor, walls, counter, roof. */
export const PARTS = 4;

/**
 * How many of the little booth's parts are built at `time`, from 0 to
 * `PARTS`: one more each beat, a beat with all of them, then it starts again.
 */
export function partsBuilt(time: number): number {
  const beat = ((time % BUILD) + BUILD) % BUILD;
  return Math.min(PARTS, Math.floor((beat / BUILD) * (PARTS + 1)));
}

/** The workshop: a workbench where a little booth is built part by part, its hammer tapping. */
const workshop: NorthPoleSquare = {
  id: 'workshop',
  name: 'Workshop',
  description: 'An accepted request is built here, in a folder of its own.',
  stall: { shape: 'cabin', roof: 'pine', trim: 'gold' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 44);
      box(ctx, -18, -10, 36, 20, 10, colors.wood, colors.gingerbread, colors.cocoa);
      const built = partsBuilt(time);
      // The little booth on the bench: floor, walls, counter, roof.
      if (built > 0) box(ctx, -8, -6, 16, 12, 2, colors.snowShade, colors.cream, colors.slab, 10);
      if (built > 1) box(ctx, -7, -5, 14, 2, 12, colors.berry, colors.berry, colors.cocoa, 12);
      if (built > 2) box(ctx, -7, 1, 14, 4, 4, colors.cream, colors.gold, colors.gingerbread, 12);
      if (built > 3) {
        box(ctx, -9, -7, 18, 10, 2, colors.snow, colors.berry, colors.cocoa, 24);
        const sign = iso(-2, 3, 22);
        glow(ctx, sign.x, sign.y, 14, 0.7);
      }
      // The hammer, tapping on the next part.
      const tap = Math.abs(Math.sin(time / 180));
      box(ctx, 10, -4, 2, 2, 8, colors.wood, colors.wood, colors.cocoa, 12 + tap * 6);
      box(ctx, 9, -5, 4, 4, 3, colors.ink, colors.ink, colors.shadow, 20 + tap * 6);
    });
  },
};

export default workshop;
