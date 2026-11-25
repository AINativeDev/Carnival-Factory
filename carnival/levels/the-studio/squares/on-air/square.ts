import { box, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { canvasFont, theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the light takes to swell and fade, in milliseconds: slowly, so it never flashes. */
export const SWELL = 2_400;

/** How bright the ON AIR light is at `time`, from 0.7 to 1: it never goes dark while a show is on. */
export function brightness(time: number): number {
  return 0.85 + 0.15 * Math.sin((time / SWELL) * Math.PI * 2);
}

/** The ON AIR light: a red sign over the studio door, glowing while a show is recorded. */
const onAir: NorthPoleSquare = {
  id: 'on-air',
  name: 'ON AIR light',
  description:
    'The red light over the door: when it glows, a show is being recorded, so come in quietly.',
  stall: { shape: 'kiosk', roof: 'violet', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 40);
      // The wall and the door under the light.
      box(ctx, -16, -16, 32, 2, 34, colors.mountainFar, colors.mountainFar, colors.mountain);
      box(ctx, -6, -14, 12, 1, 22, colors.cocoa, colors.cocoa, colors.wood);
      const knob = iso(4, -13, 10);
      ctx.fillStyle = colors.gold;
      ctx.fillRect(knob.x - 0.8, knob.y - 0.8, 1.6, 1.6);
      // The light's red glow on the wall, swelling and fading.
      const bright = brightness(time);
      const sign = iso(0, -13, 29);
      ctx.fillStyle = colors.berry;
      for (const r of [22, 15, 9]) {
        ctx.globalAlpha = 0.14 * bright;
        ctx.beginPath();
        ctx.arc(sign.x, sign.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors.ink;
      ctx.fillRect(sign.x - 15, sign.y - 5.5, 30, 11);
      ctx.fillStyle = colors.berry;
      ctx.globalAlpha = bright;
      ctx.fillRect(sign.x - 13.5, sign.y - 4, 27, 8);
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors.snow;
      ctx.font = canvasFont('small', 'bold');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.translate(sign.x, sign.y + 0.4);
      ctx.scale(0.45, 0.45);
      ctx.fillText('ON AIR', 0, 0);
      ctx.restore();
    });
  },
};

export default onAir;
