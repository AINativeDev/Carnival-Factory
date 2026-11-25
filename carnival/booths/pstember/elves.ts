/**
 * The two elves who load the sleigh: one carries a parcel from the stack and
 * walks back empty-handed, the other waits by the sleigh and reaches up to take it.
 */
import { iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx, line, poly } from './brush';
import { flatParcel } from './parcels';
import { ease, elfWalk } from './timing';

const { colors } = theme;

/** Where an elf stands, which way they face and what their arms and legs are doing. */
interface ElfPose {
  x: number;
  y: number;
  face: 1 | -1;
  stride: number;
  arms: number;
  holding: boolean;
}

/** An elf in a green coat and an aurora-trimmed cap. `arms` is 0 with them down, 1 reaching up; `stride` swings the legs. */
function elf(ctx: Ctx, { x, y, face, stride, arms, holding }: ElfPose) {
  shadow(ctx, x, y + 0.3, 6);
  const swing = Math.sin(stride) * 1.2;
  line(ctx, colors.ink, 1.1, [x - 0.7, y - 2.6], [x - 0.7 + swing * face, y]);
  line(ctx, colors.ink, 1.1, [x + 0.7, y - 2.6], [x + 0.7 - swing * face, y]);
  poly(ctx, colors.pine, [
    { x: x - 2.1, y: y - 2.4 },
    { x: x + 2.1, y: y - 2.4 },
    { x: x + 1.5, y: y - 6.4 },
    { x: x - 1.5, y: y - 6.4 },
  ]);
  poly(
    ctx,
    colors.pineDark,
    [
      { x: x + 0.2, y: y - 2.4 },
      { x: x + 2.1, y: y - 2.4 },
      { x: x + 1.5, y: y - 6.4 },
      { x: x + 0.2, y: y - 6.4 },
    ],
    0.7,
  );
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 2, y - 3.9, 4, 0.7);
  // Arms: down at the sides, forward holding a parcel, or reaching up.
  const reach = holding ? 0.5 : arms;
  line(
    ctx,
    colors.pine,
    0.9,
    [x + face * 1.4, y - 5.8],
    [x + face * (2.3 + reach), y - 4.6 - reach * 2.6],
  );
  line(
    ctx,
    colors.pine,
    0.9,
    [x - face * 1.4, y - 5.8],
    [x - face * 0.2 + face * reach, y - 4.4 - reach * 3],
  );
  if (holding) flatParcel(ctx, x + face * 3.4, y - 5.6, 3.2);
  circle(ctx, x, y - 8, 1.8, colors.horizon);
  circle(ctx, x + face * 0.7, y - 8.2, 0.22, colors.ink);
  // Cap, with a bobble and an aurora band.
  poly(ctx, colors.pine, [
    { x: x - 1.9, y: y - 8.7 },
    { x: x + 1.9, y: y - 8.7 },
    { x: x - face * 0.6, y: y - 12.6 },
  ]);
  ctx.fillStyle = colors.aurora;
  ctx.fillRect(x - 1.95, y - 9, 3.9, 0.7);
  circle(ctx, x - face * 0.6, y - 12.8, 0.6, colors.gold);
  // Pointed ears.
  poly(ctx, colors.horizon, [
    { x: x - 1.7, y: y - 8 },
    { x: x - 3, y: y - 8.9 },
    { x: x - 1.6, y: y - 8.9 },
  ]);
  poly(ctx, colors.horizon, [
    { x: x + 1.7, y: y - 8 },
    { x: x + 3, y: y - 8.9 },
    { x: x + 1.6, y: y - 8.9 },
  ]);
}

/** Both elves at `t` through the round: the one by the sleigh first, so the carrier walks in front. */
export function elves(ctx: Ctx, t: number) {
  const walk = elfWalk(t);
  const from = iso(-15, -3);
  const to = iso(-12, -7);
  const catching = t >= 0.42 && t < 0.64 ? ease((t - 0.42) / 0.08) * ease((0.64 - t) / 0.08) : 0;
  const second = iso(-8, -6);
  elf(ctx, {
    x: second.x,
    y: second.y,
    face: -1,
    stride: 0,
    arms: catching,
    holding: false,
  });
  elf(ctx, {
    x: from.x + (to.x - from.x) * walk.pos,
    y:
      from.y +
      (to.y - from.y) * walk.pos +
      (walk.moving ? -Math.abs(Math.sin(t * Math.PI * 40)) * 0.5 : 0),
    face: walk.moving && t >= 0.58 ? -1 : 1,
    stride: t * Math.PI * 40,
    arms: 0,
    holding: walk.carrying,
  });
}
