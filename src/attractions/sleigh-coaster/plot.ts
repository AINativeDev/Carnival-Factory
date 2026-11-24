import type { NorthPolePlot } from '../../northpole/plot';
import { theme } from '../../northpole/theme';

const { colors } = theme;

/** One ride, from one edge of the plot to the other, in milliseconds. */
export const RIDE = 5_000;

/**
 * The height of the track at `x`, both in the plot's 0 to 100 units: a small
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

/** A sleigh-ride roller coaster that loops over a snowy hill. */
const attraction: NorthPolePlot = {
  owner: 'sleigh-coaster',
  name: 'Sleigh-Ride Coaster',
  description: "Santa's sleigh rattles up the hill and whooshes down the other side.",
  draw(ctx, size, time) {
    const u = size / 100;

    ctx.fillStyle = colors.night;
    ctx.fillRect(0, 0, size, size);

    // Stars that twinkle in turn.
    ctx.fillStyle = colors.glow;
    for (let i = 0; i < 9; i++) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time / 500 + i * 2.1);
      ctx.fillRect(((i * 37) % 97) * u, ((i * 23) % 30) * u + 4 * u, 1.2 * u, 1.2 * u);
    }
    ctx.globalAlpha = 1;

    // The snowy hill under the track.
    ctx.fillStyle = colors.snow;
    ctx.beginPath();
    ctx.moveTo(0, size);
    for (let x = 0; x <= 100; x += 2) ctx.lineTo(x * u, (trackY(x) + 6) * u);
    ctx.lineTo(size, size);
    ctx.closePath();
    ctx.fill();

    // The trestles holding the track up.
    ctx.strokeStyle = colors.wood;
    ctx.lineWidth = 1 * u;
    for (let x = 4; x < 100; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x * u, trackY(x) * u);
      ctx.lineTo(x * u, (trackY(x) + 6) * u);
      ctx.stroke();
    }

    // The track, a candy-cane rail.
    ctx.lineWidth = 2 * u;
    ctx.setLineDash([3 * u, 3 * u]);
    for (const [color, offset] of [
      [colors.snow, 0],
      [colors.berry, 3 * u],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.lineDashOffset = offset;
      ctx.beginPath();
      for (let x = 0; x <= 100; x += 1) {
        if (x === 0) ctx.moveTo(0, trackY(0) * u);
        else ctx.lineTo(x * u, trackY(x) * u);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // The sleigh, tilted with the track, with a sack of presents.
    const { x, y, angle } = sleighAt(time);
    ctx.save();
    ctx.translate(x * u, y * u);
    ctx.rotate(angle);
    ctx.fillStyle = colors.gold;
    ctx.fillRect(-7 * u, -1.5 * u, 14 * u, 1.5 * u);
    ctx.fillStyle = colors.berry;
    ctx.beginPath();
    ctx.moveTo(-7 * u, -2 * u);
    ctx.lineTo(6 * u, -2 * u);
    ctx.quadraticCurveTo(9 * u, -6 * u, 6 * u, -9 * u);
    ctx.lineTo(-5 * u, -9 * u);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = colors.wood;
    ctx.beginPath();
    ctx.arc(-3 * u, -11 * u, 3.5 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.pine;
    ctx.fillRect(1 * u, -13 * u, 4 * u, 4 * u);
    ctx.restore();
  },
};

export default attraction;
