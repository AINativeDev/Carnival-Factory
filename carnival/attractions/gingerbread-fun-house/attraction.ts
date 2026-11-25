/**
 * The Gingerbread Fun House: a crooked gingerbread house that visitors
 * decorate. Each tap sticks a gumdrop, an icing swirl or a candy where it
 * lands, and an elf strolls past the two round fun-house mirrors, which
 * stretch it tall and squash it wide as it goes by.
 */
import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { scene } from '../../../src/northpole/diorama';
import { canvasFont, theme } from '../../../src/northpole/theme';
import { bare, decorate, type Decorating } from './decorating';
import { drawHouse, leaning } from './house';
import { mirrored, strollingElf, treat } from './stroller';

export { CHASE, gumdropLit } from './house';

const { colors } = theme;

/** The treats stuck on the house so far: the fun house's one memory, for one visit. */
let house: Decorating = bare();

/** The invitation over the house until the first treat goes on, breathing slowly. */
function invitation(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save();
  ctx.globalAlpha = 0.8 + 0.2 * Math.sin(time / 900);
  ctx.fillStyle = colors.night;
  ctx.fillRect(24, 6, 52, 10);
  ctx.translate(50, 11.5);
  ctx.scale(0.5, 0.5);
  ctx.fillStyle = colors.glow;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Tap to decorate!', 0, 0);
  ctx.restore();
}

const attraction: NorthPoleSquare = {
  id: 'gingerbread-fun-house',
  name: 'Gingerbread Fun House',
  description: 'A crooked gingerbread house to decorate, with wobbly mirrors that stretch an elf.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'cabin', roof: 'gingerbread', trim: 'snow', landmark: 'gingerbread-house' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    if (pointer && pointer.presses > 0)
      house = decorate(
        house,
        (pointer.x * 100) / size,
        (pointer.y * 100) / size,
        time,
        pointer.presses,
      );
    scene(ctx, size, time, () => {
      drawHouse(ctx, time, (at, r, mirror) => {
        mirrored(ctx, time, at, r, mirror);
      });
      leaning(ctx, time, () => {
        for (const placed of house.placed) treat(ctx, placed, time);
      });
      strollingElf(ctx, time);
      if (house.count === 0) invitation(ctx, time);
    });
  },
};

export default attraction;
