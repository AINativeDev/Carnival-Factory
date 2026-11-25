import { box, glow, iso, scene, shadow } from '../../../../../northpole/diorama';
import type { NorthPoleSquare } from '../../../../../northpole/square';
import { theme } from '../../../../../northpole/theme';

const { colors } = theme;

/** Where a skater is on the ice at `time`: going round an ellipse, a lap every 6 seconds. */
export function skaterAt(time: number, n: number): { x: number; y: number } {
  const turn = (time / 6000) * Math.PI * 2 + n * 2.1;
  return { x: Math.cos(turn) * 9, y: Math.sin(turn) * 5 };
}

/** A rack of skates in a hut, and skaters going round the rink in front. */
const skateRental: NorthPoleSquare = {
  id: 'skate-rental',
  name: 'Skate Rental',
  description: 'Pick a pair of skates from the rack and join the skaters going round.',
  stall: { shape: 'shed', roof: 'ice', trim: 'snow' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      // The rink: a sheet of ice on the slab.
      ctx.fillStyle = colors.ice;
      const rink = iso(4, 4);
      ctx.beginPath();
      ctx.ellipse(rink.x, rink.y, 26, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      // The hut at the back, with its rack of skates.
      box(ctx, -18, -18, 16, 10, 18, colors.snow, colors.wood, colors.cocoa);
      glow(ctx, iso(-10, -8, 8).x, iso(-10, -8, 8).y, 10, 0.8);
      for (let n = 0; n < 5; n++) {
        const hook = iso(-16 + n * 3, -8, 12);
        ctx.fillStyle = n % 2 ? colors.berry : colors.gold;
        ctx.fillRect(hook.x - 1, hook.y, 2, 4);
      }
      // Two skaters going round.
      for (let n = 0; n < 2; n++) {
        const at = skaterAt(time, n);
        const foot = { x: rink.x + at.x * 2, y: rink.y + at.y };
        shadow(ctx, foot.x, foot.y, 6);
        ctx.fillStyle = n ? colors.pine : colors.berry;
        ctx.fillRect(foot.x - 2, foot.y - 10, 4, 8);
        ctx.fillStyle = colors.cream;
        ctx.beginPath();
        ctx.arc(foot.x, foot.y - 12, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  },
};

export default skateRental;
