/**
 * The treehouse stall: a plank hut on stilts, built against a thick pine
 * trunk that rises behind it into tiers of snowy boughs over its hipped roof.
 * A ladder leans on the side we see, up to a lit side door, and the drawing
 * is on the hut's front.
 */
import { glow, quad } from './brushes';
import { band } from './faces';
import { stallFront } from './stall-front';
import { spotPoint, type StallParts } from './stall-plan';
import { peakedRoof, prism } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** How high the hut's floor stands on its stilts, and how far back it reaches. */
const STILTS = 14;
const HUT = 0.62;
/** How far back the trunk stands, and how far in from the side we see, so it shows past the hut. */
const TRUNK = { inset: 0.2, depth: 0.84 };
/** The tiers of boughs: each one's radius, its foot over the ground and its rise. */
const BOUGHS = [
  { radius: 0.5, lift: 104, rise: 44 },
  { radius: 0.4, lift: 134, rise: 38 },
  { radius: 0.28, lift: 160, rise: 32 },
] as const;

/** The treehouse: trunk and boughs behind, the hut on its stilts, its roof, then the ladder. */
export function drawTreehouse(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, wall, roof, look, square, paint, owner } = parts;
  const trunk = { along: face.out.x < 0 ? 1 - TRUNK.inset : TRUNK.inset, depth: TRUNK.depth };
  const ring = (radius: number, sides: number, at = trunk) =>
    Array.from({ length: sides }, (_, n) => {
      const turn = (n / sides) * Math.PI * 2;
      return spotPoint(face, deep, {
        along: at.along + Math.cos(turn) * radius,
        depth: at.depth + Math.sin(turn) * radius,
      });
    });
  prism(ctx, ring(0.15, 12), BOUGHS[0].lift + 10, undefined, colors.wood, colors.cocoa);
  for (const tier of BOUGHS) {
    const tierRing = ring(tier.radius, 10);
    peakedRoof(ctx, tierRing, tier.lift, tier.rise, [colors.pine, colors.pineDark]);
    // A dusting of snow on each tier's tip.
    const tip = shrunk(tierRing, spotPoint(face, deep, trunk), 0.35);
    peakedRoof(ctx, tip, tier.lift + tier.rise * 0.65, tier.rise * 0.35, [colors.snow]);
  }
  const hut = [
    { along: 0, depth: 0 },
    { along: 1, depth: 0 },
    { along: 1, depth: HUT },
    { along: 0, depth: HUT },
  ];
  const floor = hut.map((at) => spotPoint(face, deep, at));
  ctx.fillStyle = colors.cocoa;
  for (const along of [0.06, 0.94]) {
    const foot = spotPoint(face, deep, { along, depth: 0.04 });
    ctx.fillRect(foot.x - 2.5, foot.y - STILTS, 5, STILTS);
  }
  prism(ctx, floor, wall - STILTS, undefined, colors.gingerbread, colors.wood, STILTS);
  ctx.fillStyle = colors.cocoa;
  for (let k = 0; k < 8; k++) {
    const lift = STILTS + ((wall - STILTS) * k) / 8;
    band(ctx, face, 0, 1, lift, lift + 1.2);
    ctx.fill();
  }
  stallFront(ctx, face, square, paint, owner);
  const centre = spotPoint(face, deep, { along: 0.5, depth: HUT / 2 });
  const eaves = shrunk(floor, centre, 1.12);
  peakedRoof(ctx, eaves, wall, roof, [look.roof]);
  peakedRoof(ctx, shrunk(eaves, centre, 0.45), wall + roof * 0.55, roof * 0.45, [colors.snow]);
  ladder(ctx, parts);
}

/** An outline drawn in towards `centre`, or out from it, by `scale`. */
function shrunk(points: Tile[], centre: Tile, scale: number): Tile[] {
  return points.map((p) => ({
    x: centre.x + (p.x - centre.x) * scale,
    y: centre.y + (p.y - centre.y) * scale,
  }));
}

/** The lit side door on the side we see, and the ladder leaning up to it from the snow. */
function ladder(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep } = parts;
  const right = face.out.x < 0;
  const side = right ? 1 : 0;
  const away = right ? 1 : -1;
  const at = (out: number, depth: number, lift: number) =>
    spotPoint(face, deep, { along: side + away * out, depth }, lift);
  const sill = 64;
  const door = at(0, 0.31, sill + 16);
  glow(ctx, door.x, door.y, 18, 0.8);
  ctx.fillStyle = colors.night;
  quad(ctx, [at(0, 0.24, sill), at(0, 0.38, sill), at(0, 0.38, sill + 30), at(0, 0.24, sill + 30)]);
  ctx.fill();
  // The rails lean out from the sill to their feet in the snow, with rungs between.
  const rail = (depth: number, t: number) => at(0.2 * (1 - t), depth, sill * t);
  ctx.fillStyle = colors.wood;
  for (let n = 1; n < 7; n++) {
    const t = n / 7;
    quad(ctx, [rail(0.24, t), rail(0.38, t), rail(0.38, t + 0.02), rail(0.24, t + 0.02)]);
    ctx.fill();
  }
  ctx.fillStyle = colors.gingerbread;
  for (const depth of [0.24, 0.38]) {
    const [foot, top] = [rail(depth, 0), rail(depth, 1.05)];
    quad(ctx, [
      { x: foot.x - 1.5, y: foot.y },
      { x: foot.x + 1.5, y: foot.y },
      { x: top.x + 1.5, y: top.y },
      { x: top.x - 1.5, y: top.y },
    ]);
    ctx.fill();
  }
}
