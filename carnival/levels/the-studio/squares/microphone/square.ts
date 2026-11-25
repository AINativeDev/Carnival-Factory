import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** The bars of the waveform on the screen behind the microphone. */
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

/** The Microphone: a studio microphone on a boom arm over the desk, a pop filter before it, and the voices' waveform behind. */
const microphone: NorthPoleSquare = {
  id: 'microphone',
  name: 'Microphone',
  description:
    'The microphone the podcast is recorded on: long talks with people who build software with AI.',
  stall: { shape: 'kiosk', roof: 'berry', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 40);
      // The screen behind, with the waveform on it.
      box(ctx, -16, -16, 32, 2, 26, colors.surface, colors.surface, colors.night);
      for (let n = 0; n < BARS; n++) {
        const tall = barHeight(time, n) * 9;
        const bar = iso(-13 + n * 3.2, -14, 15 + tall / 2);
        ctx.fillStyle = colors.aurora;
        ctx.fillRect(bar.x - 0.8, bar.y - tall / 2, 1.6, tall);
      }
      // The desk, and the boom arm's clamp on its corner.
      box(ctx, -14, -4, 28, 12, 7, colors.wood, colors.gingerbread, colors.cocoa);
      box(ctx, 9, -1, 3, 3, 6, colors.ink, colors.ink, colors.shadow, 7);
      // The boom arm: up from the clamp, then out over the desk.
      const clamp = iso(10, 0, 13);
      const elbow = iso(10, 0, 30);
      const head = iso(-2, 2, 26);
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(clamp.x, clamp.y);
      ctx.lineTo(elbow.x, elbow.y);
      ctx.lineTo(head.x + 3, head.y - 3);
      ctx.stroke();
      // The microphone itself: a silver capsule with a grille, hanging from the arm.
      ctx.fillStyle = colors.slabShade;
      ctx.fillRect(head.x - 2.6, head.y - 4, 5.2, 11);
      ctx.fillStyle = colors.slab;
      ctx.beginPath();
      ctx.ellipse(head.x, head.y - 4, 2.6, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.shadow;
      ctx.lineWidth = 0.4;
      for (let row = 0; row < 4; row++) {
        ctx.beginPath();
        ctx.moveTo(head.x - 2.6, head.y - 2 + row * 2);
        ctx.lineTo(head.x + 2.6, head.y - 2 + row * 2);
        ctx.stroke();
      }
      // The pop filter: a round gauze in front of it, so no puff of breath reaches it.
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 0.8;
      ctx.fillStyle = colors.night;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.ellipse(head.x - 6, head.y + 2, 3.2, 4.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();
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

export default microphone;
