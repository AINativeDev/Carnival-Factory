import type { NorthPoleSquare } from '../../../src/northpole/square';
import { box, glow, iso, scene, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

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

const GUMDROPS = [colors.berry, colors.mint, colors.gold, colors.violet];

/** A path round points on the ground, given as [gx, gy, z]. */
function path(ctx: CanvasRenderingContext2D, points: readonly (readonly number[])[]) {
  ctx.beginPath();
  points.forEach(([gx, gy, z], n) => {
    const p = iso(gx, gy, z);
    if (n) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  });
  ctx.closePath();
}

/** A gingerbread fun house with icing trim, a wobbly mirror window and gumdrop lights blinking on and off. */
const attraction: NorthPoleSquare = {
  id: 'gingerbread-fun-house',
  name: 'Gingerbread Fun House',
  description: 'A crooked gingerbread house with gumdrop lights and a wobbly mirror.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'cabin', roof: 'gingerbread', trim: 'snow', landmark: 'gingerbread-house' },
  draw(ctx, size, time) {
    scene(ctx, size, time, () => {
      const wall = 20;
      const ridge = 32;
      const base = iso(0, 10);
      shadow(ctx, base.x + 4, base.y - 6, 62);

      // The house leans a little, as a fun house should.
      ctx.save();
      ctx.translate(base.x, base.y);
      ctx.rotate(Math.sin(time / 1500) * 0.03 - 0.03);
      ctx.translate(-base.x, -base.y);

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
      for (const [a, b] of [
        [iso(-16, 0, ridge), iso(16, 0, ridge)],
        [iso(-16, 12, wall - 1), iso(16, 12, wall - 1)],
        [iso(16, 12, wall - 1), iso(16, 0, ridge)],
      ]) {
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

      // The wobbly mirror windows: circles that stretch and squash.
      const wobble = Math.sin(time / 400);
      for (const [gx, sign] of [
        [-9, 1],
        [9, -1],
      ]) {
        const p = iso(gx, 10, 11);
        ctx.fillStyle = colors.ice;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 3.6 + sign * wobble, 3.6 - sign * wobble, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.snowLit;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Gumdrop lights along the eaves, chasing each other.
      const lights = 9;
      for (let i = 0; i < lights; i++) {
        const p = iso(-16 + (i / (lights - 1)) * 32, 12, wall - 3);
        const lit = gumdropLit(i, lights, time);
        if (lit) glow(ctx, p.x, p.y, 3, 0.8);
        ctx.globalAlpha = lit ? 1 : 0.4;
        ctx.fillStyle = GUMDROPS[i % GUMDROPS.length];
        ctx.beginPath();
        ctx.arc(p.x, p.y - 0.6, 1.4, Math.PI, 0);
        ctx.lineTo(p.x + 1.4, p.y + 0.6);
        ctx.lineTo(p.x - 1.4, p.y + 0.6);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.restore();
    });
  },
};

export default attraction;
