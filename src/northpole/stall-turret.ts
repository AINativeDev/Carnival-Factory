/**
 * The turret stall: a round stone tower laid in staggered courses of slab
 * blocks, a corbelled ring at its top, a conical roof in the stall's roof
 * colour and a small gold flag waving gently from its point. Lit arrow slits
 * look out over the board, which carries the drawing before the tower as on
 * the kiosk.
 */
import { glow, quad } from './brushes';
import { band } from './faces';
import { stallFront } from './stall-front';
import { spotPoint, STALL, type StallParts } from './stall-plan';
import { peakedRoof, prism } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** How tall one course of stone is, and how tall the corbelled ring at the top. */
const COURSE = 13;
const CORBEL = 8;

/** The turret: its courses, the corbel and roof, its flag and arrow slits, then the board. */
export function drawTurret(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, ground, wall, roof, look, square, paint, owner, time } = parts;
  const centre = spotPoint(face, deep, { along: 0.5, depth: 0.5 });
  const courses = Math.round(wall / COURSE);
  for (let k = 0; k < courses; k++) {
    // Blocks staggered course by course, light and lighter stone on the lit side.
    const lit = (n: number) => ((n + k) % 2 ? colors.slab : colors.hill);
    const shaded = (n: number) => ((n + k) % 2 ? colors.slabShade : colors.mountainFar);
    const height = wall / courses;
    prism(ctx, ground, height - 0.8, undefined, lit, shaded, k * height);
  }
  const corbel = shrunk(ground, centre, 1.14);
  prism(ctx, corbel, CORBEL, colors.slabShade, colors.slab, colors.slabShade, wall);
  // The arrow slits: on the front, over the board, and round the side we see.
  const front = Math.max(...ground.map((p) => p.y)) - centre.y;
  for (const [x, y] of [
    [0, front],
    [front * 1.2, front * 0.6],
    [-front * 1.2, front * 0.6],
  ] as const) {
    const slit = { x: centre.x + x, y: centre.y + y - wall + 20 };
    glow(ctx, slit.x, slit.y, 10, 0.7);
    ctx.fillStyle = colors.lantern;
    ctx.fillRect(slit.x - 1.5, slit.y - 7, 3, 13);
  }
  peakedRoof(ctx, corbel, wall + CORBEL, roof - CORBEL, [look.roof]);
  flag(ctx, { x: centre.x, y: centre.y - wall - roof }, Math.sin(time / 900) * 2);
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

/** A small gold flag on a pole from the roof's point, its tip waving by `wave`. */
function flag(ctx: CanvasRenderingContext2D, point: Tile, wave: number) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(point.x - 1, point.y - 18, 2, 18);
  ctx.fillStyle = colors.gold;
  quad(ctx, [
    { x: point.x + 1, y: point.y - 18 },
    { x: point.x + 14, y: point.y - 14 + wave },
    { x: point.x + 1, y: point.y - 10 },
  ]);
  ctx.fill();
}
