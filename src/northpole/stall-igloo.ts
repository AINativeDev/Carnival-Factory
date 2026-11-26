/**
 * The igloo stall: a dome of snow blocks laid in courses that narrow to the
 * top, with a little arched tunnel out of its side and a warm glow in its
 * doorway. The dome has no flat front, so the drawing stands on a board before
 * it, as on the tent and the kiosk.
 */
import { glow, quad } from './brushes';
import { band } from './faces';
import { stallFront } from './stall-front';
import { spotPoint, STALL, type StallParts } from './stall-plan';
import { prism } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** How many courses of blocks the dome is laid in. */
const COURSES = 6;

/** The igloo: its dome, its tunnel on the side we see, then the board with the drawing. */
export function drawIgloo(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, ground, wall, roof, square, paint, owner } = parts;
  const centre = spotPoint(face, deep, { along: 0.5, depth: 0.5 });
  const height = wall + roof;
  for (let k = 0; k < COURSES; k++) {
    const low = (k / COURSES) * (Math.PI / 2);
    const high = ((k + 1) / COURSES) * (Math.PI / 2);
    const course = shrunk(ground, centre, Math.cos((low + high) / 2));
    // Blocks staggered course by course, the way an igloo's are laid.
    const lit = (n: number) => ((n + k) % 2 ? colors.snow : colors.snowShade);
    const shaded = (n: number) => ((n + k) % 2 ? colors.slab : colors.slabShade);
    const lift = height * Math.sin(low);
    prism(ctx, course, height * Math.sin(high) - lift, colors.snow, lit, shaded, lift);
  }
  tunnel(ctx, parts);
  ctx.fillStyle = colors.cocoa;
  band(ctx, face, 0.03, 0.97, 0, STALL.wall);
  ctx.fill();
  stallFront(ctx, face, square, paint, owner);
}

/** An outline drawn in towards `centre` by `scale`. */
function shrunk(ground: Tile[], centre: Tile, scale: number): Tile[] {
  return ground.map((p) => ({
    x: centre.x + (p.x - centre.x) * scale,
    y: centre.y + (p.y - centre.y) * scale,
  }));
}

/**
 * The entrance tunnel: a half-round barrel of snow out of the dome's side we
 * see (the right with the door facing left, the left with it facing right),
 * its arched end dark inside with the warm glow of the room.
 */
function tunnel(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep } = parts;
  const right = face.out.x < 0;
  const inner = right ? 0.78 : 0.22;
  const outer = right ? 1.06 : -0.06;
  // A point on the tunnel's arch, `turn` from 0 to a half turn over it, `along` the spot.
  const onArch = (along: number, turn: number, scale = 1) =>
    spotPoint(
      face,
      deep,
      { along, depth: 0.5 + Math.cos(turn) * 0.16 * scale },
      Math.sin(turn) * 28 * scale,
    );
  const arch = (along: number, scale: number) =>
    Array.from({ length: 9 }, (_, n) => onArch(along, (n / 8) * Math.PI, scale));
  // The barrel's strips, back to front, lit where they turn to the upper left.
  const strips = Array.from({ length: 8 }, (_, n) => {
    const [from, to] = [(n / 8) * Math.PI, ((n + 1) / 8) * Math.PI];
    const points = [onArch(inner, from), onArch(inner, to), onArch(outer, to), onArch(outer, from)];
    return { points, lit: n >= 4 === right };
  });
  strips.sort((a, b) => lowest(a.points) - lowest(b.points));
  for (const strip of strips) {
    ctx.fillStyle = strip.lit ? colors.snow : colors.snowShade;
    quad(ctx, strip.points);
    ctx.fill();
  }
  const end = arch(outer, 1);
  ctx.fillStyle = colors.snowLit;
  quad(ctx, end);
  ctx.fill();
  ctx.fillStyle = colors.night;
  quad(ctx, arch(outer, 0.7));
  ctx.fill();
  const door = spotPoint(face, deep, { along: outer, depth: 0.5 }, 8);
  glow(ctx, door.x, door.y, 16, 0.9);
}

/** How far down the screen a strip reaches, to draw the farther ones first. */
function lowest(points: Tile[]): number {
  return points.reduce((sum, p) => sum + p.y, 0);
}
