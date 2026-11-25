import type { NorthPoleSquare } from '../../../src/northpole/square';
import { box, glow, iso, scene, shadow } from '../../../src/northpole/diorama';
import { signFont, theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** How long a fleck of confetti takes to drift down past the gallery, in milliseconds. */
export const DRIFT = 6_000;

/** The confetti's colours, in turn. */
const FLECKS = [colors.berry, colors.gold, colors.mint, colors.violet] as const;

/**
 * Where fleck `n` of the confetti is at `time`: drifting down from the top of
 * the square to the snow, swaying, each a little after the one before.
 */
export function fleckAt(time: number, n: number): { x: number; y: number } {
  const fall = (((time / DRIFT + n / 9) % 1) + 1) % 1;
  return { x: 8 + ((n * 23) % 84) + Math.sin(fall * 6 + n) * 3, y: 4 + fall * 70 };
}

/** The gallery's hall and its columns, in scene units. */
export const HALL = { gx: -16, gy: -12, w: 32, d: 22, h: 20 };

/**
 * The Year in Review: a small cream gallery at dusk, four columns before its
 * lit doors, '26 → '27 on its frieze under a pediment, a gold dome on the
 * roof, and confetti drifting down to see the year out. On the map it takes
 * the sleigh into the gallery room of the same name.
 */
const theYearInReview: NorthPoleSquare = {
  id: 'the-year-in-review',
  name: 'The Year in Review',
  description:
    'Take the sleigh to the gallery: looking back on ’26 and ahead to ’27, with your answers on the walls.',
  // How it stands on the home map: what it is, a gallery (ADR 0042).
  stall: { shape: 'kiosk', roof: 'gold', trim: 'cream', landmark: 'gallery' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 54);
      const { gx, gy, w, d, h } = HALL;
      box(ctx, gx - 2, gy - 2, w + 4, d + 6, 2, colors.snow, colors.snowShade, colors.slab);
      box(ctx, gx, gy, w, d, h, colors.snowShade, colors.cream, colors.cream, 2);
      // The lit doors, and a column either side of each.
      const door = iso(gx + w / 2, gy + d, 6);
      glow(ctx, door.x, door.y, 12, 0.8);
      ctx.fillStyle = colors.glow;
      ctx.fillRect(door.x - 3, door.y - 4, 6, 8);
      for (const at of [3, 11, 21, 29])
        box(ctx, gx + at, gy + d + 1, 2, 2, h, colors.snow, colors.snow, colors.snowShade, 2);
      // The frieze, with the year turning on it, and the pediment over it.
      box(ctx, gx - 1, gy, w + 2, d + 4, 4, colors.cream, colors.cream, colors.snowShade, h + 2);
      const frieze = iso(gx + w / 2, gy + d + 4, h + 4);
      ctx.fillStyle = colors.berry;
      ctx.font = signFont('serif', 4);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('’26 → ’27', frieze.x, frieze.y);
      const [left, right, peak] = [
        iso(gx - 1, gy + d + 4, h + 6),
        iso(gx + w + 1, gy + d + 4, h + 6),
        iso(gx + w / 2, gy + d + 4, h + 14),
      ];
      ctx.fillStyle = colors.cream;
      ctx.beginPath();
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.lineTo(peak.x, peak.y);
      ctx.fill();
      // The gold dome on the roof.
      const dome = iso(gx + w / 2, gy + d / 2, h + 6);
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.ellipse(dome.x, dome.y, 9, 8, 0, Math.PI, 0);
      ctx.fill();
      // Confetti drifting down.
      for (let n = 0; n < 9; n++) {
        const fleck = fleckAt(time, n);
        ctx.fillStyle = FLECKS[n % FLECKS.length] ?? colors.gold;
        ctx.fillRect(fleck.x, fleck.y, 1.6, 1);
      }
    });
  },
};

export default theYearInReview;
