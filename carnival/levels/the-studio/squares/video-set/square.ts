import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the camera's red light takes to blink on and off, in milliseconds. */
export const BLINK = 1_200;

/** Whether the camera's red light is on at `time`: on for the first half of each blink. */
export const recording = (time: number) => ((time % BLINK) + BLINK) % BLINK < BLINK / 2;

/** A studio light on a stand at (gx, gy), its lamp glowing towards the set. */
function studioLight(ctx: CanvasRenderingContext2D, gx: number, gy: number) {
  box(ctx, gx - 0.5, gy - 0.5, 1, 1, 18, colors.ink, colors.ink, colors.shadow);
  box(ctx, gx - 2, gy - 2, 4, 4, 4, colors.ink, colors.slab, colors.slabShade, 18);
  const lamp = iso(gx, gy, 20);
  glow(ctx, lamp.x, lamp.y, 12, 0.9);
}

/** The Video Set: a camera on its tripod, two studio lights, and a big screen with a play button. */
const videoSet: NorthPoleSquare = {
  id: 'video-set',
  name: 'Video Set',
  description: 'Where the videos are made: talks, demos and walkthroughs for the YouTube channel.',
  stall: { shape: 'shed', roof: 'berry', trim: 'snow' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 48);
      // The screen at the back, and the play button on it.
      box(ctx, -12, -16, 24, 2, 24, colors.surface, colors.surface, colors.night, 4);
      const play = iso(0, -14, 16);
      ctx.fillStyle = colors.berry;
      ctx.beginPath();
      ctx.ellipse(play.x, play.y, 6, 4.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.snow;
      ctx.beginPath();
      ctx.moveTo(play.x - 1.6, play.y - 2.4);
      ctx.lineTo(play.x + 2.6, play.y);
      ctx.lineTo(play.x - 1.6, play.y + 2.4);
      ctx.closePath();
      ctx.fill();
      studioLight(ctx, -15, -4);
      studioLight(ctx, 15, -6);
      // The camera on its tripod, facing the screen, and its red light.
      for (const [dx, dy] of [
        [-3, 0],
        [3, 0],
        [0, 3],
      ] as const)
        box(ctx, 2 + dx * 0.4, 8 + dy * 0.4, 0.8, 0.8, 9, colors.ink, colors.ink, colors.shadow);
      box(ctx, -1, 5, 6, 7, 5, colors.ink, colors.slab, colors.slabShade, 9);
      box(ctx, 0, 3, 4, 2, 4, colors.ink, colors.ink, colors.shadow, 9.5);
      if (recording(time)) {
        const light = iso(4, 6, 15);
        glow(ctx, light.x, light.y, 5, 0.9);
        ctx.fillStyle = colors.berry;
        ctx.beginPath();
        ctx.arc(light.x, light.y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  },
};

export default videoSet;
