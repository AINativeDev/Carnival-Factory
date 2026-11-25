import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** The sliders along the mixing desk. */
export const SLIDERS = 6;

/** How far up slider `n` is at `time`, from 0 to 1: each one eases up and down at its own pace. */
export function sliderAt(time: number, n: number): number {
  return (Math.sin(time / (900 + n * 170) + n * 1.3) + 1) / 2;
}

/** The Mixing desk: its sliders move up and down, with a level meter and a window to the sound booth. */
const mixingDesk: NorthPoleSquare = {
  id: 'mixing-desk',
  name: 'Mixing desk',
  description: 'Where each episode is mixed and edited, so every voice comes through clear.',
  stall: { shape: 'kiosk', roof: 'mint', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 48);
      // The window to the booth behind, lit warm.
      box(ctx, -16, -16, 32, 2, 26, colors.slab, colors.slab, colors.slabShade);
      const pane = iso(0, -14, 18);
      glow(ctx, pane.x, pane.y, 16, 0.7);
      ctx.fillStyle = colors.glow;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(pane.x - 12, pane.y - 5, 24, 10);
      ctx.globalAlpha = 1;
      // The desk, its slots, and a slider in each.
      box(ctx, -16, -4, 32, 14, 8, colors.ink, colors.surface, colors.night);
      for (let n = 0; n < SLIDERS; n++) {
        const gx = -13 + n * 5;
        box(ctx, gx, -2, 1, 10, 0.3, colors.night, colors.night, colors.night, 8);
        const up = sliderAt(time, n);
        box(ctx, gx - 1, 6 - up * 8, 3, 2, 2, colors.snow, colors.snowShade, colors.slab, 8);
      }
      // The level meter on the desk's corner, rising with the loudest slider.
      const loudest = Math.max(...Array.from({ length: SLIDERS }, (_, n) => sliderAt(time, n)));
      for (let lamp = 0; lamp < 5; lamp++) {
        const at = iso(14, -3, 10 + lamp * 2.4);
        ctx.fillStyle =
          lamp / 5 < loudest ? (lamp < 3 ? colors.aurora : colors.berry) : colors.muted;
        ctx.fillRect(at.x - 1.2, at.y - 0.9, 2.4, 1.8);
      }
    });
  },
};

export default mixingDesk;
