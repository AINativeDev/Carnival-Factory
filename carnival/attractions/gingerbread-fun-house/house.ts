/**
 * The Gingerbread Fun House itself: a crooked gingerbread house on the snow,
 * with a chocolate roof thick with icing and gumdrop lights chasing along its
 * eaves. Its windows, door and roof gumdrops are Icing Echo's notes, drawn by
 * `fixtures.ts` on top of it.
 */
import { box, glow, iso, shadow, type Point } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { LEAN_FROM } from './decorating';

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

/** A path round points on the ground, given as [gx, gy, z]. */
export function path(
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
 * Draws `paint` leaning with the house, turned `turn` radians: the house sways
 * and wobbles about the foot of its front wall, and so does all that's on it.
 */
export function leaning(ctx: CanvasRenderingContext2D, turn: number, paint: () => void) {
  ctx.save();
  ctx.translate(LEAN_FROM.x, LEAN_FROM.y);
  ctx.rotate(turn);
  ctx.translate(-LEAN_FROM.x, -LEAN_FROM.y);
  paint();
  ctx.restore();
}

/**
 * The gingerbread fun house, turned `turn` radians: its walls, its iced roof,
 * the warm light by its door, whatever `fixtures` draws on it, and gumdrop
 * lights chasing along its eaves.
 */
export function drawHouse(
  ctx: CanvasRenderingContext2D,
  turn: number,
  time: number,
  fixtures: () => void,
) {
  const wall = 20;
  const ridge = 32;
  const base = iso(0, 10);
  shadow(ctx, base.x + 4, base.y - 6, 62);
  leaning(ctx, turn, () => {
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

    // The doorway's warm light, under whatever the door shows.
    const door = iso(0, 10, 6);
    glow(ctx, door.x, door.y, 13, 0.8);
    fixtures();

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
