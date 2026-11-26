import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long between deploys on the little map, in milliseconds. */
export const DEPLOY = 5_000;

/**
 * How tall the new booth stands on its spot at `time`, from 0 (a
 * construction site) to 1 (built), springing up just after each deploy.
 */
export function riseAt(time: number): number {
  const phase = (((time / DEPLOY) % 1) + 1) % 1;
  return Math.min(1, phase * 3);
}

/** The spots on the little map, by where they sit on the table: the last one gets the new booth. */
const SPOTS: readonly [number, number][] = [
  [-12, -10],
  [-2, -10],
  [8, -10],
  [-12, 2],
  [-2, 2],
  [8, 2],
];

/** The map: a table with a little North Pole on it, where a new booth springs up on its spot after each deploy. */
const map: NorthPoleSquare = {
  id: 'map',
  name: 'The Map',
  description: 'It goes live: the next deploy puts the booth on its spot.',
  stall: { shape: 'tent', roof: 'berry', trim: 'snow' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 46);
      box(ctx, -16, -14, 32, 26, 8, colors.snow, colors.wood, colors.cocoa);
      box(ctx, -15, -5, 30, 2, 0.4, colors.horizon, colors.horizon, colors.horizon, 8);
      const rise = riseAt(time);
      SPOTS.forEach(([gx, gy], n) => {
        const last = n === SPOTS.length - 1;
        const roof =
          [colors.berry, colors.pine, colors.violet, colors.gold, colors.mint][n] ?? colors.berry;
        const h = last ? 7 * rise : 7;
        if (h > 0.2) box(ctx, gx, gy, 5, 5, h, roof, colors.cream, colors.snowShade, 8);
        if (last && rise < 1) {
          box(ctx, gx, gy, 5, 5, 0.5, colors.gold, colors.gold, colors.gold, 8);
        }
      });
      // A sparkle over the new booth as it lands.
      const mark = iso(10.5, 4.5, 18);
      glow(ctx, mark.x, mark.y, 12, 1 - rise * 0.6);
    });
  },
};

export default map;
