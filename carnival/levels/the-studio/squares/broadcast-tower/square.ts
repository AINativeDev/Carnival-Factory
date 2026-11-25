import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long a wave takes to spread from the antenna and fade, in milliseconds. */
export const WAVE = 2_700;

/** How far wave `n` has spread at `time`, from 0 (at the antenna) to 1 (gone): three waves in turn. */
export function waveAt(time: number, n: number): number {
  return (((time / WAVE + n / 3) % 1) + 1) % 1;
}

/** The tower's height, in scene units, and how far its waves spread. */
export const TOWER = { h: 40, reach: 22 };

/** The Broadcast Tower: a lattice mast with a blinking light on top, sending waves out over the North Pole. */
const broadcastTower: NorthPoleSquare = {
  id: 'broadcast-tower',
  name: 'Broadcast Tower',
  description: 'Where each new episode and video is sent out, for anyone to listen to or watch.',
  stall: { shape: 'kiosk', roof: 'violet', trim: 'snow' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 40);
      box(ctx, -8, -8, 16, 16, 4, colors.slab, colors.slab, colors.slabShade);
      // The mast: two legs narrowing to the top, with cross braces.
      const base = iso(0, 0, 4);
      const top = iso(0, 0, TOWER.h);
      ctx.strokeStyle = colors.berry;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(base.x - 7, base.y);
      ctx.lineTo(top.x, top.y);
      ctx.lineTo(base.x + 7, base.y);
      for (let k = 1; k < 5; k++) {
        const y = base.y + ((top.y - base.y) * k) / 5;
        const half = 7 * (1 - k / 5);
        ctx.moveTo(top.x - half, y);
        ctx.lineTo(top.x + half, y);
      }
      ctx.stroke();
      // The waves, spreading out from the top and fading.
      ctx.strokeStyle = colors.aurora;
      for (let n = 0; n < 3; n++) {
        const spread = waveAt(time, n);
        ctx.globalAlpha = 1 - spread;
        ctx.beginPath();
        ctx.arc(top.x, top.y, 3 + spread * TOWER.reach, -Math.PI * 0.85, -Math.PI * 0.15);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // The light on top, blinking.
      const on = Math.sin(time / 300) > 0;
      if (on) glow(ctx, top.x, top.y, 8, 1);
      ctx.fillStyle = on ? colors.berry : colors.cocoa;
      ctx.beginPath();
      ctx.arc(top.x, top.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
  },
};

export default broadcastTower;
