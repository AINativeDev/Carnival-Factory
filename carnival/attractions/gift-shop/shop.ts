import { box, glow, iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { lookOf, parcel, type Place } from './parcel';
import { type Ctx, front, outline, words } from './shopfront';
import { settling, type Wrapping } from './wrapping';

const { colors } = theme;

/** The shop's front wall faces the lower left, at this gy, and stands this tall. */
const FRONT = 2;
const WALL = 28;

/** Where parcel `n` sits in the window: four to a shelf along the front, filling the lowest shelf first. */
export function shelfPlace(n: number): Place {
  const s = 3.2;
  return { gx: -16 + (n % 4) * 5.5, gy: FRONT - s, z: 4 + Math.floor(n / 4) * 6, s };
}

/** The wooden hut, its shop window facing the lower left, with its planks. */
function hut(ctx: Ctx) {
  const c = iso(-3, -6);
  shadow(ctx, c.x + 2, c.y + 4, 60);
  box(ctx, -20, -12, 30, 14, WALL, colors.snow, colors.wood, colors.cocoa);
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 0.35;
  for (let z = 4; z < WALL; z += 4) {
    const a = iso(-20, FRONT, z);
    const b = iso(10, FRONT, z);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

/** The window, dark inside, its three shelves holding the parcels wrapped so far, the newest one lit. */
function shopWindow(ctx: Ctx, time: number, wrapping: Wrapping) {
  ctx.fillStyle = colors.ink;
  front(ctx, -17, 7, FRONT, 3, 21);
  ctx.fill();
  ctx.fillStyle = colors.gingerbread;
  for (const z of [3, 9, 15]) {
    front(ctx, -17, 7, FRONT, z, z + 1);
    ctx.fill();
  }
  const { shelf } = wrapping;
  const newest = shelf.length - 1;
  if (newest >= 0) {
    // A warm pool of light on the newest parcel, breathing slowly.
    const at = shelfPlace(newest);
    const lit = iso(at.gx + 2, FRONT, at.z + 2);
    glow(ctx, lit.x, lit.y, 9, 1.4 + 0.3 * Math.sin(time / 900));
  }
  const drop = settling(wrapping, time);
  shelf.forEach((p, n) => {
    const at = shelfPlace(n);
    const z = n === newest ? at.z + 3 * drop : at.z;
    parcel(ctx, { ...at, z }, lookOf(p));
  });
}

/** The striped awning over the window, and snow along its edge. */
function awning(ctx: Ctx) {
  const stripes = 8;
  for (let i = 0; i < stripes; i++) {
    const gx0 = -20 + (30 * i) / stripes;
    const gx1 = gx0 + 30 / stripes;
    ctx.fillStyle = i % 2 ? colors.snowLit : colors.berry;
    outline(ctx, [
      iso(gx0, FRONT, WALL),
      iso(gx1, FRONT, WALL),
      iso(gx1, FRONT + 3, WALL - 2),
      iso(gx0, FRONT + 3, WALL - 2),
    ]);
    ctx.fill();
  }
  ctx.fillStyle = colors.snow;
  front(ctx, -20, 10, FRONT, WALL, WALL + 1.5);
  ctx.fill();
}

/** The sign on the roof, gold, running along the front as the wall does. */
function sign(ctx: Ctx) {
  box(ctx, -15, -3, 20, 1.2, 7, colors.gold, colors.gold, colors.wood, WALL);
  const at = iso(-5, -1.8, WALL + 3.5);
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.transform(1, 0.5, 0, 1, 0, 0);
  ctx.fillStyle = colors.cocoa;
  words(ctx, 'GIFT SHOP', 0, 0, 4.4, 18, 'bold');
  ctx.restore();
}

/** The whole shop at `time`, back to front, its window showing what's been wrapped. */
export function shop(ctx: Ctx, time: number, wrapping: Wrapping) {
  hut(ctx);
  shopWindow(ctx, time, wrapping);
  awning(ctx);
  sign(ctx);
}
