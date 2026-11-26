/**
 * The lighthouse stall: a tall round tower striped in the stall's roof and
 * trim colours, tapering up from a keeper's stone base to a gallery with its
 * rail, and a glass lantern room under a pointed cap. A soft warm beam turns
 * slowly from the lamp, once in 16 seconds, and never flashes. The drawing
 * stands on a board before the tower, as on the kiosk.
 */
import { glow, quad } from './brushes';
import { band } from './faces';
import { sidesOf } from './rounds';
import { stallFront } from './stall-front';
import { spotPoint, STALL, type StallParts } from './stall-plan';
import { peakedRoof, prism } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** How tall the keeper's base is, how many stripes the tower has, and how narrow its top is. */
const BASE = 26;
const STRIPES = 6;
const TAPER = 0.78;
/** How tall the lantern room is, and how long the lamp's beam takes to go round, in milliseconds. */
const LANTERN = 18;
const SWEEP = 16_000;

/** The lighthouse: base, striped tower, gallery and lantern, its beam, then the board. */
export function drawLighthouse(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, ground, wall, roof, look, square, paint, owner, time } = parts;
  const centre = spotPoint(face, deep, { along: 0.5, depth: 0.5 });
  const base = [
    { along: 0.08, depth: 0.08 },
    { along: 0.92, depth: 0.08 },
    { along: 0.92, depth: 0.92 },
    { along: 0.08, depth: 0.92 },
  ].map((at) => spotPoint(face, deep, at));
  prism(ctx, base, BASE, colors.snowShade, colors.slab, colors.slabShade);
  const scaleAt = (lift: number) => 1 + ((TAPER - 1) * (lift - BASE)) / (wall - BASE);
  for (let k = 0; k < STRIPES; k++) {
    const low = BASE + ((wall - BASE) * k) / STRIPES;
    const high = BASE + ((wall - BASE) * (k + 1)) / STRIPES;
    const color = k % 2 ? look.trim : look.roof;
    tapered(ctx, ground, centre, [scaleAt(low), low], [scaleAt(high), high], color);
  }
  // The gallery round the top, its rail, and the lantern room inside it.
  const gallery = shrunk(ground, centre, 1.18);
  prism(ctx, gallery, 5, colors.slabShade, colors.slab, colors.slabShade, wall);
  const lantern = shrunk(ground, centre, 0.6);
  prism(ctx, lantern, LANTERN, undefined, colors.lantern, colors.glow, wall + 5);
  const lamp = { x: centre.x, y: centre.y - wall - 5 - LANTERN / 2 };
  glow(ctx, lamp.x, lamp.y, 26, 1);
  prism(ctx, gallery, 1.5, undefined, colors.ink, colors.ink, wall + 14);
  for (const p of gallery.filter((p) => p.y > centre.y)) {
    ctx.fillStyle = colors.ink;
    ctx.fillRect(p.x - 0.75, p.y - wall - 14, 1.5, 9);
  }
  const cap = shrunk(ground, centre, 0.75);
  peakedRoof(ctx, cap, wall + 5 + LANTERN, roof - 5 - LANTERN, [look.roof]);
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(centre.x, centre.y - wall - roof - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  beam(ctx, lamp, (time / SWEEP) * Math.PI * 2);
  ctx.fillStyle = colors.cocoa;
  band(ctx, face, 0.03, 0.97, 0, STALL.wall);
  ctx.fill();
  stallFront(ctx, face, square, paint, owner);
}

/** An outline drawn in towards `centre`, or out from it, by `scale`. */
function shrunk(points: Tile[], centre: Tile, scale: number): Tile[] {
  return points.map((p) => ({
    x: centre.x + (p.x - centre.x) * scale,
    y: centre.y + (p.y - centre.y) * scale,
  }));
}

/**
 * One stripe of the tower, between two rings given as [scale, lift]: the sides
 * we see, the ones turned from the light under the dusk's shadow.
 */
function tapered(
  ctx: CanvasRenderingContext2D,
  ground: Tile[],
  centre: Tile,
  [lowScale, low]: [number, number],
  [highScale, high]: [number, number],
  color: string,
) {
  const at = (p: Tile, scale: number, lift: number) => ({
    x: centre.x + (p.x - centre.x) * scale,
    y: centre.y + (p.y - centre.y) * scale - lift,
  });
  for (const { p, q } of sidesOf(ground)) {
    if (p.y + q.y <= centre.y * 2) continue;
    quad(ctx, [
      at(p, lowScale, low),
      at(q, lowScale, low),
      at(q, highScale, high),
      at(p, highScale, high),
    ]);
    ctx.fillStyle = color;
    ctx.fill();
    if (p.x + q.x < centre.x * 2) continue;
    ctx.fillStyle = colors.night;
    ctx.globalAlpha = 0.2;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/** The lamp's beam, a soft warm wedge pointing `turn` round, foreshortened on the ground's plane. */
function beam(ctx: CanvasRenderingContext2D, lamp: Tile, turn: number) {
  const reach = (angle: number, length: number) => ({
    x: lamp.x + Math.cos(angle) * length,
    y: lamp.y + Math.sin(angle) * length * 0.5,
  });
  ctx.fillStyle = colors.glow;
  for (const [spread, alpha] of [
    [0.22, 0.14],
    [0.1, 0.22],
  ] as const) {
    ctx.globalAlpha = alpha;
    quad(ctx, [lamp, reach(turn - spread, 72), reach(turn + spread, 72)]);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
