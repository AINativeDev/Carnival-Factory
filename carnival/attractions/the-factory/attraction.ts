import type { NorthPoleSquare } from '../../../src/northpole/square';
import { box, glow, iso, scene, shadow } from '../../../src/northpole/diorama';
import { canvasFont, theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** How long a puff of smoke takes to rise from the chimney and fade, in milliseconds. */
export const PUFF = 3_200;

/** How long a parcel takes to ride the belt from the door to the end, in milliseconds. */
export const BELT = 4_000;

/**
 * Puff `n` from the chimney at `time`: how far it has risen, from 0 (just
 * out) to 1 (gone). Three puffs rise in turn.
 */
export function puffAt(time: number, n: number): number {
  return (((time / PUFF + n / 3) % 1) + 1) % 1;
}

/** How far parcel `n` is along the belt at `time`, from 0 (at the door) to 1 (off the end). */
export function parcelAt(time: number, n: number): number {
  return (((time / BELT + n / 2) % 1) + 1) % 1;
}

/** The sign over the door: the Tessl name, in the theme's font, `height` units tall. */
function sign(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  ctx.save();
  ctx.font = canvasFont('title', 'bold');
  const k = height / theme.font.title;
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.ink;
  ctx.fillText('Tessl', 0, 0);
  ctx.restore();
}

/**
 * The Factory: the North Pole's own landmark, a brick-warm workshop with a
 * smoking chimney, a Tessl sign over its lit door and parcels riding out on a
 * belt. On the map it takes the sleigh into the level of the same name.
 */
const theFactory: NorthPoleSquare = {
  id: 'the-factory',
  name: 'The Factory',
  description: 'Take the sleigh inside and walk how a booth gets built, one stall at a time.',
  stall: { shape: 'shed', roof: 'gingerbread', trim: 'gold' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 50);
      box(ctx, -18, -14, 30, 26, 22, colors.snow, colors.gingerbread, colors.cocoa);
      // The saw-tooth roof's lit ridges.
      for (const gy of [-14, -5, 4])
        box(ctx, -18, gy, 30, 4, 4, colors.snowShade, colors.cream, colors.slab, 22);
      box(ctx, 4, -12, 5, 5, 16, colors.ink, colors.wood, colors.cocoa, 22);
      for (let n = 0; n < 3; n++) {
        const t = puffAt(time, n);
        const puff = iso(6.5 - t * 4, -9.5, 40 + t * 22);
        ctx.fillStyle = colors.cloud;
        ctx.globalAlpha = 0.7 * (1 - t);
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, 2.5 + t * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // The lit door, and the Tessl sign over it.
      const door = iso(-6, 12, 7);
      glow(ctx, door.x, door.y, 18);
      ctx.fillStyle = colors.glow;
      ctx.fillRect(door.x - 5, door.y - 7, 10, 14);
      const board = iso(-6, 12, 18);
      ctx.fillStyle = colors.gold;
      ctx.fillRect(board.x - 10, board.y - 3.5, 20, 7);
      sign(ctx, board.x, board.y, 6);
      // The belt out of the door, with parcels riding it.
      box(ctx, -16, 13, 6, 9, 3, colors.ink, colors.surface, colors.night);
      for (let n = 0; n < 2; n++) {
        const t = parcelAt(time, n);
        box(ctx, -15, 13 + t * 7, 3, 2, 3, colors.berry, colors.berry, colors.cocoa, 3);
      }
    });
  },
};

export default theFactory;
