import { box, glow, iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { GIFTS, SHOW } from './gifts';
import { type Ctx, front, outline, words } from './shopfront';

const { colors } = theme;

/** Where each gift sits in the window, along the front and up: three on the top shelf, two below. */
const PLACES = [
  [-14, 12],
  [-7, 12],
  [0, 12],
  [-10.5, 5],
  [-3.5, 5],
] as const;

/** The shop's front wall faces the lower left, at this gy, and stands this tall. */
const FRONT = 2;
const WALL = 28;

/** A wrapped box on the shelf at (gx, z) in the window, with a ribbon and a bow. */
function gift(ctx: Ctx, gx: number, z: number, wrap: string) {
  box(ctx, gx, FRONT - 2, 4, 2, 4, wrap, wrap, colors.shadow, z);
  // The ribbon, round its front and over its top.
  ctx.fillStyle = colors.snowLit;
  front(ctx, gx + 1.6, gx + 2.4, FRONT, z, z + 4);
  ctx.fill();
  const bow = iso(gx + 2, FRONT - 1, z + 4.6);
  ctx.beginPath();
  ctx.ellipse(bow.x - 1, bow.y, 1.1, 0.7, 0, 0, Math.PI * 2);
  ctx.ellipse(bow.x + 1, bow.y, 1.1, 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
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

/** The window, dark inside, with two shelves of gifts; gift `shown` is lit and lifts a little. */
function shopWindow(ctx: Ctx, time: number, shown: number) {
  ctx.fillStyle = colors.ink;
  front(ctx, -17, 7, FRONT, 3, 21);
  ctx.fill();
  ctx.fillStyle = colors.gingerbread;
  for (const z of [4, 11]) {
    front(ctx, -17, 7, FRONT, z, z + 1);
    ctx.fill();
  }

  // A warm pool of light on the gift in the spotlight, breathing slowly.
  const [sx, sz] = PLACES[shown] ?? PLACES[0];
  const lit = iso(sx + 2, FRONT, sz + 2);
  glow(ctx, lit.x, lit.y, 10, 1.6 + 0.3 * Math.sin((time / SHOW) * Math.PI * 2));
  PLACES.forEach(([gx, z], i) => {
    const lift = i === shown ? 0.8 + 0.5 * Math.sin(time / 600) : 0;
    gift(ctx, gx, z + lift, (GIFTS[i] ?? GIFTS[0]).wrap);
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

/** The whole shop at `time`, back to front, with gift `shown` in the spotlight. */
export function shop(ctx: Ctx, time: number, shown: number) {
  hut(ctx);
  shopWindow(ctx, time, shown);
  awning(ctx);
  sign(ctx);
}
