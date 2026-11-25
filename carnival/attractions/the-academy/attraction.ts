import type { NorthPoleSquare } from '../../../src/northpole/square';
import { box, glow, iso, scene, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** How long the bell takes to swing there and back, in milliseconds. */
export const SWING = 2_000;

/** How far the bell has swung at `time`, in radians either side of hanging straight. */
export const bellSwing = (time: number) => Math.sin((time / SWING) * Math.PI * 2) * 0.4;

/** The schoolhouse and the bell tower on its roof, in scene units. */
export const HOUSE = { gx: -18, gy: -10, w: 34, d: 20, h: 16 };
export const BELFRY = { gx: -6, gy: -4, w: 10, d: 8, h: 14 };

/** A pitched roof along the house's length, from its eaves up to the ridge. */
function roof(ctx: CanvasRenderingContext2D, lift: number) {
  const { gx, gy, w, d } = HOUSE;
  const ridge = gy + d / 2;
  const at = (x: number, y: number, z: number) => iso(x, y, lift + z);
  const faces: [string, number][] = [
    [colors.berry, gy + d],
    [colors.cocoa, gy],
  ];
  for (const [colour, eave] of faces) {
    const a = at(gx - 1, eave, 0);
    const b = at(gx + w + 1, eave, 0);
    const c = at(gx + w + 1, ridge, 10);
    const e = at(gx - 1, ridge, 10);
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(e.x, e.y);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * The Academy: the North Pole's own school, a cream schoolhouse with a red
 * roof, rows of lit windows and a bell tower whose gold bell swings. On the
 * map it takes the sleigh into the level of the same name.
 */
const theAcademy: NorthPoleSquare = {
  id: 'the-academy',
  name: 'The Academy',
  description: 'Take the sleigh to the campus and walk the Academy’s lessons, one stall for each.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'barn', roof: 'berry', trim: 'cream', landmark: 'schoolhouse' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 56);
      const { gx, gy, w, d, h } = HOUSE;
      box(ctx, gx, gy, w, d, h, colors.cream, colors.cream, colors.snowShade);
      // Two rows of lit windows along the front, and the door in the middle.
      for (const z of [4, 10])
        for (let n = 0; n < 6; n++) {
          if (z === 4 && (n === 2 || n === 3)) continue;
          const at = iso(gx + 3 + n * 5.4, gy + d, z + 2);
          ctx.fillStyle = colors.glow;
          ctx.fillRect(at.x - 1.3, at.y - 1.8, 2.6, 3.6);
        }
      const door = iso(gx + w / 2, gy + d, 3.5);
      glow(ctx, door.x, door.y, 12, 0.8);
      ctx.fillStyle = colors.wood;
      ctx.fillRect(door.x - 3, door.y - 3.5, 6, 7);
      roof(ctx, h);
      // The bell tower on the ridge, its open belfry, and its bell.
      const b = BELFRY;
      box(ctx, b.gx, b.gy, b.w, b.d, b.h, colors.snowShade, colors.cream, colors.snowShade, h + 6);
      const opening = iso(b.gx + b.w / 2, b.gy + b.d, h + 6 + b.h * 0.55);
      ctx.fillStyle = colors.night;
      ctx.fillRect(opening.x - 3, opening.y - 4, 6, 7);
      ctx.save();
      ctx.translate(opening.x, opening.y - 3.5);
      ctx.rotate(bellSwing(time));
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.moveTo(-2.2, 5);
      ctx.quadraticCurveTo(-2, 0.5, 0, 0.5);
      ctx.quadraticCurveTo(2, 0.5, 2.2, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // The spire on top, with a gold star.
      const base = iso(b.gx + b.w / 2, b.gy + b.d / 2, h + 6 + b.h);
      ctx.fillStyle = colors.berry;
      ctx.beginPath();
      ctx.moveTo(base.x - 8, base.y + 1);
      ctx.lineTo(base.x, base.y - 10);
      ctx.lineTo(base.x + 8, base.y + 1);
      ctx.closePath();
      ctx.fill();
      glow(ctx, base.x, base.y - 11, 6, 0.9);
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.arc(base.x, base.y - 11, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
  },
};

export default theAcademy;
