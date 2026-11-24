import type { NorthPoleSquare } from '../../../../northpole/square';
import { glow, iso, pine, scene, shadow } from '../../../../northpole/diorama';
import { theme } from '../../../../northpole/theme';

const { colors } = theme;

/** How far the float bobs at `time`, and whether a fish is biting: one bite every 5 seconds. */
export function floatAt(time: number): { bob: number; biting: boolean } {
  const phase = (time % 5000) / 5000;
  const biting = phase > 0.8;
  return { bob: Math.sin(time / (biting ? 90 : 500)) * (biting ? 2 : 0.8), biting };
}

/** A hole in the ice with a line and a float, an elf's stool beside it, and a pine behind. */
const iceFishing: NorthPoleSquare = {
  id: 'ice-fishing',
  name: 'Ice Fishing',
  description: 'Sit by the hole in the ice and wait for a bite. Every so often, one comes.',
  stall: { shape: 'tent', roof: 'pine', trim: 'snow' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      pine(ctx, iso(-14, -14).x, iso(-14, -14).y, 30);
      pine(ctx, iso(12, -16).x, iso(12, -16).y, 24);
      ctx.fillStyle = colors.ice;
      const ice = iso(0, 4);
      ctx.beginPath();
      ctx.ellipse(ice.x, ice.y, 30, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.night;
      ctx.beginPath();
      ctx.ellipse(ice.x, ice.y, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // The rod, its line and the float.
      const { bob, biting } = floatAt(time);
      const seat = iso(-8, 6);
      shadow(ctx, seat.x, seat.y, 8);
      ctx.fillStyle = colors.berry;
      ctx.fillRect(seat.x - 2, seat.y - 9, 4, 7);
      ctx.strokeStyle = colors.wood;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(seat.x + 1, seat.y - 6);
      ctx.lineTo(ice.x, ice.y - 14);
      ctx.lineTo(ice.x, ice.y + bob);
      ctx.stroke();
      ctx.fillStyle = biting ? colors.gold : colors.berry;
      ctx.beginPath();
      ctx.arc(ice.x, ice.y + bob, 1.2, 0, Math.PI * 2);
      ctx.fill();
      if (biting) glow(ctx, ice.x, ice.y, 8, 0.6);
    });
  },
};

export default iceFishing;
