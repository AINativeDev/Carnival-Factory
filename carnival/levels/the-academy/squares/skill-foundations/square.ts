import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long it takes to stack the blocks into a skill and start again, in milliseconds. */
export const STACK = 6_000;

/** The building blocks, bottom to top: each a part of a skill. */
export const BLOCKS = [colors.berry, colors.gold, colors.mint, colors.violet];

/**
 * How many blocks are stacked at `time`, from 0 to `BLOCKS.length`: one more
 * each beat, a beat with the whole stack and its skill card, then again.
 */
export function blocksStacked(time: number): number {
  const beat = ((time % STACK) + STACK) % STACK;
  return Math.min(BLOCKS.length, Math.floor((beat / STACK) * (BLOCKS.length + 1)));
}

/** Skill Foundations: building blocks stacking up on a table, and a skill card glowing once they're all on. */
const skillFoundations: NorthPoleSquare = {
  id: 'skill-foundations',
  name: 'Skill Foundations',
  description:
    'What a skill is, how to write your first one, and how your agent reaches for it when it needs it.',
  stall: { shape: 'kiosk', roof: 'gold', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 46);
      box(ctx, -18, -10, 36, 20, 8, colors.wood, colors.gingerbread, colors.cocoa);
      // The blocks, one on another, each a little narrower.
      const stacked = blocksStacked(time);
      BLOCKS.forEach((colour, n) => {
        if (n >= stacked) return;
        const inset = n * 1.5;
        box(
          ctx,
          -12 + inset,
          -6 + inset,
          12 - inset * 2,
          12 - inset * 2,
          5,
          colour,
          colour,
          colors.cocoa,
          8 + n * 5,
        );
      });
      // The skill card, stood up beside the stack, lit once every block is on.
      box(ctx, 6, -4, 10, 1.5, 14, colors.cream, colors.cream, colors.snowShade, 8);
      const card = iso(11, -2.5, 15);
      const done = stacked === BLOCKS.length;
      if (done) glow(ctx, card.x, card.y, 16, 0.9);
      ctx.fillStyle = done ? colors.gold : colors.muted;
      for (let line = 0; line < 3; line++)
        ctx.fillRect(card.x - 4, card.y - 4 + line * 3, 8 - line * 2, 1.2);
    });
  },
};

export default skillFoundations;
