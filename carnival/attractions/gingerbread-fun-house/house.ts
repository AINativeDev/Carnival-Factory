/**
 * The Gingerbread Fun House itself: a crooked gingerbread house on the snow,
 * with icing trim, a candy-cane door, gumdrop lights and two round fun-house
 * mirror windows.
 */
import { box, glow, iso, shadow, type Point } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { lean, LEAN_FROM } from './decorating';
import { MIRRORS } from './mirrors';

const { colors } = theme;

/** How long the gumdrop lights take to run once along the roof, in milliseconds. */
export const CHASE = 1_800;

/**
 * Whether gumdrop light `light` of `count` is lit at `time`. A dark gap runs
 * along the string once every `CHASE`, so the lights look like they chase.
 */
export function gumdropLit(light: number, count: number, time: number): boolean {
  const dark = Math.floor(((time % CHASE) / CHASE) * count);
  return light % count !== dark && (light + 1) % count !== dark;
}

/** The treat colours: the gumdrop lights, and the treats visitors stick on. */
export const GUMDROPS = [colors.berry, colors.mint, colors.gold, colors.violet];

/** How wide a mirror window is, in the scene's units. */
const MIRROR_R = 4.4;

/** A path round points on the ground, given as [gx, gy, z]. */
function path(
  ctx: CanvasRenderingContext2D,
  points: readonly (readonly [number, number, number])[],
) {
  ctx.beginPath();
  points.forEach(([gx, gy, z], n) => {
    const p = iso(gx, gy, z);
    if (n) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  });
  ctx.closePath();
}

/**
 * Draws `paint` leaning with the house at `time`: the house sways about the
 * foot of its front wall, and so do the treats stuck on it.
 */
export function leaning(ctx: CanvasRenderingContext2D, time: number, paint: () => void) {
  ctx.save();
  ctx.translate(LEAN_FROM.x, LEAN_FROM.y);
  ctx.rotate(lean(time));
  ctx.translate(-LEAN_FROM.x, -LEAN_FROM.y);
  paint();
  ctx.restore();
}

/** What shows in a mirror window: given the window's middle, its radius, and which mirror it is. */
export type InMirror = (at: Point, r: number, mirror: (typeof MIRRORS)[number]) => void;

/**
 * The gingerbread fun house, leaning: icing trim, a candy-cane door, two round
 * mirror windows showing whatever `inMirror` draws, and gumdrop lights chasing
 * along its eaves.
 */
export function drawHouse(ctx: CanvasRenderingContext2D, time: number, inMirror: InMirror) {
  const wall = 20;
  const ridge = 32;
  const base = iso(0, 10);
  shadow(ctx, base.x + 4, base.y - 6, 62);
  leaning(ctx, time, () => {
    box(ctx, -14, -10, 28, 20, wall, colors.gingerbread, colors.gingerbread, colors.wood);
    // The gable end, in the shade.
    ctx.fillStyle = colors.wood;
    path(ctx, [
      [14, 10, wall],
      [14, -10, wall],
      [14, 0, ridge],
    ]);
    ctx.fill();

    // The roof, thick with icing: chocolate, with its far slope in the shade.
    ctx.fillStyle = colors.ink;
    path(ctx, [
      [-16, 0, ridge],
      [16, 0, ridge],
      [16, -12, wall - 1],
      [-16, -12, wall - 1],
    ]);
    ctx.fill();
    ctx.fillStyle = colors.cocoa;
    path(ctx, [
      [-16, 0, ridge],
      [16, 0, ridge],
      [16, 12, wall - 1],
      [-16, 12, wall - 1],
    ]);
    ctx.fill();
    ctx.strokeStyle = colors.snowLit;
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    const edges: [Point, Point][] = [
      [iso(-16, 0, ridge), iso(16, 0, ridge)],
      [iso(-16, 12, wall - 1), iso(16, 12, wall - 1)],
      [iso(16, 12, wall - 1), iso(16, 0, ridge)],
    ];
    for (const [a, b] of edges) {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    // Icing drips along the eaves.
    ctx.fillStyle = colors.snowLit;
    for (let gx = -14; gx <= 14; gx += 4) {
      const p = iso(gx, 12, wall - 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y + 0.6, 1.3, 0, Math.PI);
      ctx.fill();
    }

    // A candy-cane door, lit warm from inside.
    const door = iso(0, 10, 6);
    glow(ctx, door.x, door.y, 13, 0.8);
    ctx.fillStyle = colors.berry;
    path(ctx, [
      [-3, 10, 0],
      [3, 10, 0],
      [3, 10, 12],
      [-3, 10, 12],
    ]);
    ctx.fill();
    ctx.fillStyle = colors.snow;
    for (let z = 1.5; z < 12; z += 3.5) {
      path(ctx, [
        [-3, 10, z],
        [3, 10, z],
        [3, 10, z + 1.2],
        [-3, 10, z + 1.2],
      ]);
      ctx.fill();
    }

    // The fun-house mirror windows: silvered ice, with what they catch inside.
    for (const mirror of MIRRORS) {
      const p = iso(mirror.gx, 10, 11);
      ctx.save();
      ctx.fillStyle = colors.ice;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, MIRROR_R, MIRROR_R * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.clip();
      inMirror(p, MIRROR_R, mirror);
      ctx.restore();
      ctx.strokeStyle = colors.snowLit;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, MIRROR_R, MIRROR_R * 1.2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Gumdrop lights along the eaves, chasing each other.
    const lights = 9;
    for (let i = 0; i < lights; i++) {
      const p = iso(-16 + (i / (lights - 1)) * 32, 12, wall - 3);
      const lit = gumdropLit(i, lights, time);
      if (lit) glow(ctx, p.x, p.y, 3, 0.8);
      ctx.globalAlpha = lit ? 1 : 0.4;
      ctx.fillStyle = GUMDROPS[i % GUMDROPS.length] ?? colors.berry;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 0.6, 1.4, Math.PI, 0);
      ctx.lineTo(p.x + 1.4, p.y + 0.6);
      ctx.lineTo(p.x - 1.4, p.y + 0.6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}
