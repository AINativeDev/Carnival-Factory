/**
 * The reindeer paddock behind the depot: trampled snow, hoof prints, a fence
 * round it and two reindeer, one grazing and one looking round. The back fences
 * go down before the reindeer and the front ones after, so the deer stand inside.
 */
import { iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx, ellipse, line, poly } from './brush';
import { earFlick, headLift } from './timing';

const { colors } = theme;

/** Where each hoof print pair sits in the paddock, and its tilt. */
const HOOF_PRINTS: [number, number, number][] = [
  [12.5, -8.5, 0],
  [14.5, -9.5, 0.3],
  [16, -16, 0.2],
  [18, -17, 0],
  [20, -9, 0.3],
  [13, -16, 0.1],
];

/** Posts and two rails along one edge of the paddock. */
function fence(ctx: Ctx, gx0: number, gy0: number, gx1: number, gy1: number, posts: number) {
  for (const z of [2.2, 4.6]) {
    const a = iso(gx0, gy0, z);
    const b = iso(gx1, gy1, z);
    line(ctx, colors.wood, 0.7, [a.x, a.y], [b.x, b.y]);
  }
  for (let i = 0; i <= posts; i++) {
    const k = i / posts;
    const base = iso(gx0 + (gx1 - gx0) * k, gy0 + (gy1 - gy0) * k, 0);
    const top = iso(gx0 + (gx1 - gx0) * k, gy0 + (gy1 - gy0) * k, 6);
    line(ctx, colors.cocoa, 1, [base.x, base.y], [top.x, top.y]);
    circle(ctx, top.x, top.y - 0.2, 0.55, colors.snow);
  }
}

/** Where a reindeer stands and how its head, ears and jaw are moving. */
interface ReindeerPose {
  x: number;
  y: number;
  lift: number;
  ears: number;
  chew: number;
}

/** A reindeer facing left, standing on (x, y). `lift` is 0 with its head down grazing, 1 with it up. */
function reindeer(ctx: Ctx, { x, y, lift, ears, chew }: ReindeerPose) {
  shadow(ctx, x, y + 0.4, 10);
  // The far legs, then the body, then the near legs.
  for (const dx of [-2.6, 2.8])
    line(ctx, colors.cocoa, 0.9, [x + dx + 0.8, y - 4], [x + dx + 0.8, y]);
  ellipse(ctx, x + 0.5, y - 5.4, 4.6, 2.5, colors.gingerbread);
  ellipse(ctx, x + 2.6, y - 4.6, 2.4, 1.2, colors.snowLit);
  for (const dx of [-3.2, 2.2]) line(ctx, colors.wood, 0.9, [x + dx, y - 4], [x + dx, y]);
  ctx.globalAlpha = 0.2;
  ellipse(ctx, x + 2.5, y - 5, 2.4, 2.2, colors.shadow);
  ctx.globalAlpha = 1;
  // The tail.
  circle(ctx, x + 5.2, y - 6.2, 0.9, colors.snowLit);
  // Neck and head.
  const hx = x - 4.8 - (1 - lift) * 1.6;
  const hy = y - 7.2 - lift * 4.6 + (1 - lift) * 5.4 + chew;
  line(ctx, colors.gingerbread, 1.9, [x - 3, y - 6.2], [hx + 0.6, hy + 0.4]);
  ellipse(ctx, hx - 0.6, hy, 1.7, 1.1, colors.gingerbread, -0.35 + (1 - lift) * 0.9);
  circle(ctx, hx - 1.9, hy + 0.5 + (1 - lift) * 0.5, 0.35, colors.ink);
  circle(ctx, hx - 0.4, hy - 0.4, 0.22, colors.ink);
  // Ears, which flick, and antlers.
  line(
    ctx,
    colors.gingerbread,
    0.8,
    [hx + 0.3, hy - 0.8],
    [hx + 1.2 + ears * 0.8, hy - 2 - ears * 0.6],
  );
  line(ctx, colors.cocoa, 0.35, [hx, hy - 1], [hx - 0.4, hy - 3.2], [hx - 1.4, hy - 4]);
  line(ctx, colors.cocoa, 0.35, [hx - 0.4, hy - 2.6], [hx + 0.6, hy - 3.6]);
}

/** The whole paddock at `t` through the round, painted back to front. */
export function paddock(ctx: Ctx, t: number) {
  // Trampled snow in the paddock, and hoof prints.
  const pad = [iso(10, -20), iso(22, -20), iso(22, -6), iso(10, -6)];
  poly(ctx, colors.snowShade, pad, 0.55);
  for (const [gx, gy, a] of HOOF_PRINTS) {
    const p = iso(gx, gy);
    ellipse(ctx, p.x, p.y, 0.55, 0.3, colors.slabShade, a);
    ellipse(ctx, p.x + 1.1, p.y + 0.35, 0.55, 0.3, colors.slabShade, a);
  }

  // Back fences, then the reindeer, then the front fences.
  fence(ctx, 10, -6, 10, -20, 4);
  fence(ctx, 10, -20, 22, -20, 4);
  const grazer = iso(13, -10);
  reindeer(ctx, {
    x: grazer.x,
    y: grazer.y,
    lift: 0,
    ears: 0,
    chew: Math.sin(t * Math.PI * 2 * 6) * 0.25,
  });
  const looker = iso(18, -14);
  reindeer(ctx, {
    x: looker.x,
    y: looker.y,
    lift: headLift(t),
    ears: earFlick(t),
    chew: 0,
  });
  fence(ctx, 10, -6, 22, -6, 4);
  fence(ctx, 22, -6, 22, -20, 4);
}
