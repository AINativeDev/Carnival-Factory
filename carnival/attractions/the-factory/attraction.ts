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

/**
 * Where a puff is drawn once it has risen `t` of the way, in the scene's
 * 100-unit square: it drifts back from the chimney and grows, and stops short
 * of the top edge so the frame never crops it before it has faded.
 */
export function puffSpot(t: number): { x: number; y: number; r: number } {
  return { ...iso(9 - t * 4, -8, 26 + t * 14), r: 2 + t * 4 };
}

/** Where the lit door stands on the hall's front, so the belt can come out of it. */
const DOOR = { gx: -10, gy: 12 };

/** The hall at the tower's foot and the tower over it, in scene units. */
export const HALL = { gx: -16, gy: -12, w: 28, d: 24, h: 12 };
export const TOWER = { gx: -9, gy: -6, w: 14, d: 12, h: 36 };

/** The letters down the tower's front. */
export const LETTERS = ['T', 'E', 'S', 'S', 'L'];

/** How far the cog on top has turned at `time`, in radians: one slow turn every 12 seconds. */
export const cogTurn = (time: number) => ((time / 12_000) % 1) * Math.PI * 2;

/** How far parcel `n` is along the belt at `time`, from 0 (at the door) to 1 (off the end). */
export function parcelAt(time: number, n: number): number {
  return (((time / BELT + n / 2) % 1) + 1) % 1;
}

/** One golden letter, `height` units tall, with a darker shadow behind it. */
function letter(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, height: number) {
  ctx.save();
  ctx.font = canvasFont('title', 'bold');
  const k = height / theme.font.title;
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.cocoa;
  ctx.fillText(text, 1.2, 1.2);
  ctx.fillStyle = colors.gold;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** The gold cog on top, turning. */
function cog(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, time: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(cogTurn(time));
  ctx.fillStyle = colors.gold;
  for (let n = 0; n < 8; n++) {
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-r * 0.2, -r * 1.3, r * 0.4, r * 0.5);
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * The Factory: the North Pole's own landmark, a tall brick tower with TESSL
 * down its front in golden letters, lit windows, a gold cog turning on top and
 * smoke from its chimney, over a hall whose belt carries parcels out of the
 * door. On the map it takes the sleigh into the level of the same name.
 */
const theFactory: NorthPoleSquare = {
  id: 'the-factory',
  name: 'The Factory',
  description: 'Take the sleigh inside and walk how a booth gets built, one stall at a time.',
  stall: { shape: 'shed', roof: 'gold', trim: 'cocoa' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 54);
      const { gx, gy, w, d, h } = HALL;
      box(ctx, gx, gy, w, d, h, colors.snow, colors.gingerbread, colors.cocoa);
      const t = TOWER;
      box(ctx, t.gx, t.gy, t.w, t.d, t.h, colors.snowShade, colors.gingerbread, colors.cocoa, h);
      // Lit windows up the tower's sides, and TESSL down its front between them.
      for (let z = h + 6; z < h + t.h - 2; z += 8) {
        for (const along of [t.gx + 2, t.gx + t.w - 2]) {
          const at = iso(along, t.gy + t.d, z);
          glow(ctx, at.x, at.y, 4, 0.8);
          ctx.fillStyle = colors.glow;
          ctx.fillRect(at.x - 0.9, at.y - 1.4, 1.8, 2.8);
        }
        const side = iso(t.gx + t.w, t.gy + t.d / 2, z);
        ctx.fillStyle = colors.glow;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(side.x - 0.9, side.y - 1.4, 1.8, 2.8);
        ctx.globalAlpha = 1;
      }
      LETTERS.forEach((text, n) => {
        const at = iso(t.gx + t.w / 2, t.gy + t.d, h + t.h - 5 - n * 6.4);
        glow(ctx, at.x, at.y, 5, 0.6);
        letter(ctx, text, at.x, at.y, 5.6);
      });
      // The chimney on the hall's roof, its smoke, and the cog on top.
      box(ctx, 7, -10, 4, 4, 12, colors.ink, colors.wood, colors.cocoa, h);
      for (let n = 0; n < 3; n++) {
        const rise = puffAt(time, n);
        const puff = puffSpot(rise);
        ctx.fillStyle = colors.cloud;
        ctx.globalAlpha = 0.7 * (1 - rise);
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      const top = iso(t.gx + t.w / 2, t.gy + t.d / 2, h + t.h + 5);
      cog(ctx, top.x, top.y, 4, time);
      // The lit door, and the belt out of it with parcels riding it.
      const door = iso(DOOR.gx, DOOR.gy, 5);
      glow(ctx, door.x, door.y, 14);
      ctx.fillStyle = colors.glow;
      ctx.fillRect(door.x - 3.5, door.y - 5, 7, 10);
      box(ctx, DOOR.gx - 3, DOOR.gy, 6, 9, 3, colors.ink, colors.surface, colors.night);
      for (let n = 0; n < 2; n++) {
        const along = parcelAt(time, n);
        const at = DOOR.gy + 1 + along * 7;
        box(ctx, DOOR.gx - 1.5, at, 3, 2, 3, colors.berry, colors.berry, colors.cocoa, 3);
      }
    });
  },
};

export default theFactory;
