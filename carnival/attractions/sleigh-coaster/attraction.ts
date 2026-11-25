import type { NorthPoleSquare } from '../../../northpole/square';
import { glow, iso, scene, shadow } from '../../../northpole/diorama';
import { theme } from '../../../northpole/theme';

const { colors } = theme;

/** One ride, from one edge of the attraction to the other, in milliseconds. */
export const RIDE = 5_000;

/**
 * The height of the track at `x`, both in the attraction's 0 to 100 units: a small
 * bump, then the big snowy hill in the middle, then a dip and a last bump.
 */
export function trackY(x: number): number {
  const hill = 38 * Math.exp(-(((x - 50) / 16) ** 2));
  const bumps = 8 * Math.exp(-(((x - 16) / 7) ** 2)) + 10 * Math.exp(-(((x - 84) / 7) ** 2));
  return 78 - hill - bumps;
}

/** Where the sleigh is at `time`, and the angle of the track under it, in radians. */
export function sleighAt(time: number): { x: number; y: number; angle: number } {
  // It slows near the top of the hill and speeds down it, like a real coaster.
  const t = (time % RIDE) / RIDE;
  const x = 100 * (t + Math.sin(t * Math.PI * 2) / (Math.PI * 4));
  const y = trackY(x);
  const angle = Math.atan2(trackY(x + 0.5) - trackY(x - 0.5), 1);
  return { x, y, angle };
}

/**
 * A point on the ride at `x`, `across` the track (from the far side to the
 * near one) and `drop` below the rail. The track runs across the slab from its
 * left corner to its right one, so it reads left to right as it always has.
 */
export function ridePoint(x: number, across: number, drop = 0) {
  const z = (78 - trackY(x)) * 0.72 + 4;
  return iso(-20 + x * 0.4 + across, 20 - x * 0.4 + across, Math.max(0, z - drop));
}

/** Where the sleigh is drawn at `time`, on the track's near rail, and its tilt in radians. */
export function sleighPose(time: number, near: number): { x: number; y: number; angle: number } {
  const { x } = sleighAt(time);
  const p = ridePoint(x, near);
  const ahead = ridePoint(Math.min(x + 1, 100), near);
  const behind = ridePoint(Math.max(x - 1, 0), near);
  return { ...p, angle: Math.atan2(ahead.y - behind.y, ahead.x - behind.x) };
}

/** A sleigh-ride roller coaster that loops over a snowy hill. */
const attraction: NorthPoleSquare = {
  id: 'sleigh-coaster',
  name: 'Sleigh-Ride Coaster',
  description: "Santa's sleigh rattles up the hill and whooshes down the other side.",
  draw(ctx, size, time) {
    scene(ctx, size, time, () => {
      const near = 3;
      const far = -3;
      const hill = 7;

      shadow(ctx, 50, 70, 86);

      // The snowy hill under the track: its slopes lit where they face the light.
      for (let x = 0; x < 100; x += 2) {
        const rising = trackY(x + 2) < trackY(x);
        ctx.fillStyle = rising ? colors.snowLit : colors.snowShade;
        const top = [
          ridePoint(x, near + 3, hill),
          ridePoint(x + 2, near + 3, hill),
          ridePoint(x + 2, far - 3, hill),
          ridePoint(x, far - 3, hill),
        ];
        ctx.beginPath();
        top.forEach((p, n) => (n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.fill();
      }
      // Its near side, in one piece.
      ctx.fillStyle = colors.slab;
      ctx.beginPath();
      for (let x = 0; x <= 100; x += 2) {
        const p = ridePoint(x, near + 3, hill);
        if (x === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      for (const x of [100, 0]) {
        const p = ridePoint(x, near + 3, 99);
        ctx.lineTo(p.x, p.y);
      }
      ctx.fill();

      // The trestles holding the track up, near and far.
      ctx.strokeStyle = colors.wood;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let x = 4; x < 100; x += 8) {
        for (const gy of [far, near]) {
          const a = ridePoint(x, gy);
          const b = ridePoint(x, gy, hill);
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
      }
      ctx.stroke();

      // The far rail in the shade, the ties, and the near one a candy-cane rail.
      const rail = (gy: number) => {
        ctx.beginPath();
        for (let x = 0; x <= 100; x += 1) {
          const p = ridePoint(x, gy);
          if (x === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      };
      ctx.strokeStyle = colors.shadow;
      ctx.lineWidth = 1.2;
      rail(far);
      ctx.strokeStyle = colors.cocoa;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let x = 2; x < 100; x += 4) {
        const a = ridePoint(x, far);
        const b = ridePoint(x, near);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.setLineDash([2.4, 2.4]);
      for (const [color, offset] of [
        [colors.snow, 0],
        [colors.berry, 2.4],
      ] as const) {
        ctx.strokeStyle = color;
        ctx.lineDashOffset = offset;
        rail(near);
      }
      ctx.setLineDash([]);

      // The sleigh, tilted with the track, with a sack of presents and a lantern.
      const pose = sleighPose(time, near);
      ctx.save();
      ctx.translate(pose.x, pose.y);
      ctx.rotate(pose.angle);
      ctx.scale(0.8, 0.8);
      glow(ctx, 6, -8, 10, 0.8);
      ctx.fillStyle = colors.gold;
      ctx.fillRect(-7, -1.5, 14, 1.5);
      ctx.fillStyle = colors.berry;
      ctx.beginPath();
      ctx.moveTo(-7, -2);
      ctx.lineTo(6, -2);
      ctx.quadraticCurveTo(9, -6, 6, -9);
      ctx.lineTo(-5, -9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = colors.shadow;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(-7, -5, 15, 3);
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors.wood;
      ctx.beginPath();
      ctx.arc(-3, -11, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.pine;
      ctx.fillRect(1, -13, 4, 4);
      ctx.fillStyle = colors.gold;
      ctx.fillRect(2.6, -13, 0.8, 4);
      ctx.restore();
    });
  },
};

export default attraction;
