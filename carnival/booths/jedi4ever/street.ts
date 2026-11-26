/**
 * The street itself: the road rushing at you with its lane marks and
 * snowbanks, the shops on both sides with lit windows and wreathed doors, and
 * the lamps that sweep past and pool warm light on the snow.
 */
import { glow } from '../../../src/northpole/diorama';
import { chance } from './game';
import { circle, colors, polygon, type Ctx } from './brushes';
import { FAR, project, VAN_DEPTH } from './view';

const SEGMENTS = 44;
/** Metres between lamps, and the length and spacing of the shops. */
const LAMP_GAP = 30;
const SHOP_GAP = 26;
const SHOP_LENGTH = 22;
/** How far from the middle the shopfronts stand, in road-widths. */
const SHOP_SIDE = 2.4;
const WALLS = [
  colors.gingerbread,
  colors.cocoa,
  colors.mountain,
  colors.wood,
  colors.violet,
] as const;

/** Something at the roadside, and how far ahead its nearest part is, for painting back to front. */
export interface Roadside {
  d: number;
  paint: (ctx: Ctx) => void;
}

/** Where segment `i` of the road begins: close together near the camera, far apart far off. */
export function segmentDepth(i: number): number {
  return 1 + FAR * (i / SEGMENTS) ** 2;
}

/** The snow, the kerbs, the road and its lane dashes, far to near. */
export function drawRoad(ctx: Ctx, size: number, dist: number) {
  for (let i = SEGMENTS - 1; i >= 0; i -= 1) {
    const d0 = segmentDepth(i + 1);
    const d1 = segmentDepth(i);
    const odd = Math.floor((dist + d1) / 8) % 2 === 1;
    const far = project(size, d0, 0, dist).y;
    const near = project(size, d1, 0, dist).y + 1;
    ctx.fillStyle = odd ? colors.snow : colors.snowLit;
    ctx.fillRect(0, far, size, near - far);
    const strip = (from: number, to: number, fill: string) => {
      polygon(
        ctx,
        [
          [project(size, d0, from, dist).x, far],
          [project(size, d0, to, dist).x, far],
          [project(size, d1, to, dist).x, near],
          [project(size, d1, from, dist).x, near],
        ],
        fill,
      );
    };
    strip(-1.55, -1, colors.slab);
    strip(1, 1.55, colors.slab);
    strip(-1, 1, odd ? colors.mountain : colors.surface);
    strip(-1.05, -0.97, colors.cream);
    strip(0.97, 1.05, colors.cream);
    if (odd) {
      strip(-0.34, -0.3, colors.cream);
      strip(0.3, 0.34, colors.cream);
    }
  }
}

/** One shop's street face: wall, snowy roof line, lit windows and a wreathed door. */
function shop(size: number, dist: number, side: number, index: number): Roadside | undefined {
  const d0 = Math.max(index * SHOP_GAP - dist, 0.8);
  const d1 = index * SHOP_GAP + SHOP_LENGTH - dist;
  if (d1 < 1 || d0 > FAR) return undefined;
  const high = 6 + chance(side + 7, index) * 5;
  const wall = WALLS[Math.floor(chance(side + 9, index) * WALLS.length)] ?? colors.wood;
  const lat = side * SHOP_SIDE;
  const a = project(size, d0, lat, dist);
  const b = project(size, d1, lat, dist);
  const rise = (p: { scale: number }) => high * p.scale * size * 0.055;
  const at = (t: number, v: number): [number, number] => [
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t - (rise(a) + (rise(b) - rise(a)) * t) * v,
  ];
  return {
    d: d0,
    paint(ctx) {
      polygon(ctx, [at(0, 0), at(1, 0), at(1, 1), at(0, 1)], wall);
      // Lit faces look left, so the left-hand shops' faces, turned right, are in shade.
      ctx.globalAlpha = 0.3;
      polygon(
        ctx,
        [at(0, 0), at(1, 0), at(1, 1), at(0, 1)],
        side < 0 ? colors.shadow : colors.snowLit,
      );
      ctx.globalAlpha = 1;
      polygon(ctx, [at(0, 1), at(1, 1), at(1, 1.18), at(0, 1.18)], colors.snow);
      for (const t of [0.12, 0.36, 0.6]) {
        ctx.globalAlpha = 0.9;
        polygon(ctx, [at(t, 0.4), at(t + 0.16, 0.4), at(t + 0.16, 0.7), at(t, 0.7)], colors.glow);
        ctx.globalAlpha = 1;
      }
      polygon(ctx, [at(0.82, 0), at(0.94, 0), at(0.94, 0.5), at(0.82, 0.5)], colors.cocoa);
      const [wx, wy] = at(0.88, 0.3);
      ctx.fillStyle = colors.pine;
      circle(ctx, wx, wy, Math.max(1, a.scale * size * 0.02));
      ctx.fillStyle = colors.berry;
      circle(ctx, wx, wy - a.scale * size * 0.012, Math.max(0.5, a.scale * size * 0.006));
    },
  };
}

/** One lamp: its post, its warm bulb and the pool of light on the snow. */
function lamp(size: number, dist: number, side: number, index: number): Roadside | undefined {
  const d = index * LAMP_GAP - dist;
  if (d < 1 || d > FAR) return undefined;
  const foot = project(size, d, side * 1.3, dist);
  const top = foot.y - foot.scale * size * 0.3;
  return {
    d,
    paint(ctx) {
      ctx.fillStyle = colors.lantern;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.ellipse(
        foot.x,
        foot.y,
        foot.scale * size * 0.45,
        foot.scale * size * 0.1,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors.ink;
      ctx.fillRect(
        foot.x - foot.scale * size * 0.01,
        top,
        Math.max(1, foot.scale * size * 0.02),
        foot.y - top,
      );
      glow(ctx, foot.x, top, foot.scale * size * 0.25);
      ctx.fillStyle = colors.glow;
      circle(ctx, foot.x, top, Math.max(1, foot.scale * size * 0.03));
    },
  };
}

/** Every shop and lamp in view on both sides of the road. */
export function roadside(size: number, dist: number): Roadside[] {
  const found: Roadside[] = [];
  const first = Math.floor(dist / SHOP_GAP) - 1;
  const lampFirst = Math.floor(dist / LAMP_GAP);
  for (const side of [-1, 1]) {
    for (let i = first; i < first + FAR / SHOP_GAP + 3; i += 1) {
      const placed = shop(size, dist, side, i);
      if (placed) found.push(placed);
    }
    for (let i = lampFirst; i < lampFirst + FAR / LAMP_GAP + 2; i += 1) {
      const placed = lamp(size, dist, side, i);
      if (placed) found.push(placed);
    }
  }
  return found;
}

/** The tyre marks the van's slide leaves in the snow behind it. */
export function drawTrails(
  ctx: Ctx,
  size: number,
  trails: readonly { x: number; at: number }[],
  dist: number,
) {
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.45;
  for (const mark of trails) {
    const d = VAN_DEPTH - (dist - mark.at);
    if (d < 1.5) continue;
    const here = project(size, d, mark.x, dist);
    const w = here.scale * size * 0.05;
    for (const side of [-1, 1]) ctx.fillRect(here.x + side * w * 3 - w / 2, here.y - w, w, w * 1.5);
  }
  ctx.globalAlpha = 1;
}
