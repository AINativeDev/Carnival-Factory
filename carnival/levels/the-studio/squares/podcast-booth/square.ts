import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** The bars of the waveform on the screen behind the desk. */
export const BARS = 9;

/**
 * How tall bar `n` of the waveform is at `time`, from 0.15 to 1: two voices
 * taking turns, so the left half and the right half rise in turn.
 */
export function barHeight(time: number, n: number): number {
  const speaking = Math.sin(time / 1_500) > 0 ? n < BARS / 2 : n >= BARS / 2;
  const level = (Math.sin(time / 110 + n * 1.7) + 1) / 2;
  return 0.15 + (speaking ? 0.85 * level : 0.1 * level);
}

/** One microphone on its stand, on the desk at (gx, gy). */
function microphone(ctx: CanvasRenderingContext2D, gx: number, gy: number) {
  box(ctx, gx - 0.5, gy - 0.5, 1, 1, 8, colors.ink, colors.ink, colors.shadow, 9);
  const head = iso(gx, gy, 19);
  ctx.fillStyle = colors.slab;
  ctx.beginPath();
  ctx.ellipse(head.x, head.y, 1.8, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** The Podcast Booth: a desk with two microphones and headphones, and the voices' waveform on the screen behind. */
const podcastBooth: NorthPoleSquare = {
  id: 'podcast-booth',
  name: 'Podcast Booth',
  description: 'Where the podcast is recorded: long talks with people who build software with AI.',
  stall: { shape: 'cabin', roof: 'berry', trim: 'snow' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 46);
      // The screen behind, with the waveform on it.
      box(ctx, -16, -16, 32, 2, 26, colors.surface, colors.surface, colors.night);
      for (let n = 0; n < BARS; n++) {
        const tall = barHeight(time, n) * 9;
        const bar = iso(-13 + n * 3.2, -14, 15 + tall / 2);
        ctx.fillStyle = colors.aurora;
        ctx.fillRect(bar.x - 0.8, bar.y - tall / 2, 1.6, tall);
      }
      // The desk, the two microphones and the headphones lying between them.
      box(ctx, -14, -4, 28, 12, 9, colors.wood, colors.gingerbread, colors.cocoa);
      microphone(ctx, -8, 2);
      microphone(ctx, 8, 2);
      const phones = iso(0, 3, 10);
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(phones.x, phones.y, 3, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = colors.berry;
      ctx.fillRect(phones.x - 4, phones.y - 1, 2, 3);
      ctx.fillRect(phones.x + 2, phones.y - 1, 2, 3);
      // The red light that says it's recording.
      const light = iso(12, -14, 30);
      glow(ctx, light.x, light.y, 6, 0.8);
      ctx.fillStyle = colors.berry;
      ctx.beginPath();
      ctx.arc(light.x, light.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
  },
};

export default podcastBooth;
