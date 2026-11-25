import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** The episode cards on the wall: how many across, and how many rows. */
export const WALL = { across: 4, rows: 3 };

/** How long the spotlight takes to move from one card to the next, in milliseconds. */
export const STEP = 1_500;

/** Which card the spotlight is on at `time`, counting along each row from the top left. */
export function cardAt(time: number): number {
  const cards = WALL.across * WALL.rows;
  return ((Math.floor(time / STEP) % cards) + cards) % cards;
}

/** The card colours, in turn across the wall. */
const CARDS = [colors.berry, colors.mint, colors.gold, colors.violet, colors.ice] as const;

/** The Episode wall: a wall of episode cards, each with a play button, and a light moving from one to the next. */
const episodeWall: NorthPoleSquare = {
  id: 'episode-wall',
  name: 'Episode wall',
  description:
    'A card for every episode and video so far: pick one, and listen or watch from the panel.',
  stall: { shape: 'kiosk', roof: 'mint', display: true },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 44);
      box(ctx, -18, -16, 36, 2, 36, colors.mountainFar, colors.mountainFar, colors.mountain);
      const lit = cardAt(time);
      for (let row = 0; row < WALL.rows; row++)
        for (let col = 0; col < WALL.across; col++) {
          const n = row * WALL.across + col;
          const at = iso(-12 + col * 8, -14, 30 - row * 10);
          if (n === lit) glow(ctx, at.x, at.y, 9, 1);
          ctx.fillStyle = CARDS[n % CARDS.length] ?? colors.snow;
          ctx.fillRect(at.x - 3.4, at.y - 3.6, 6.8, 7.2);
          ctx.fillStyle = colors.snow;
          ctx.beginPath();
          ctx.moveTo(at.x - 1, at.y - 1.6);
          ctx.lineTo(at.x + 1.8, at.y);
          ctx.lineTo(at.x - 1, at.y + 1.6);
          ctx.closePath();
          ctx.fill();
        }
      // A bench in front, to sit and choose.
      box(ctx, -10, 2, 20, 5, 5, colors.wood, colors.gingerbread, colors.cocoa);
    });
  },
};

export default episodeWall;
