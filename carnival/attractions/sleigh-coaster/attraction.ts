/**
 * The Sleigh-Ride Coaster: a tap launches the sleigh from the station, up the
 * hill and down the other side, and fills the cheer meter one more. Puts the
 * track, the meter and the sleigh together, back to front, and keeps the
 * attraction's one memory of the pointer.
 */
import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { scene, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { drawCheerMeter, drawLever } from './cheer-meter';
import { handsUp, launch, rideTime, riding, WAITING, type Ride } from './ride';
import { drawSleigh } from './sleigh';
import { ridePoint, sleighPose, trackY } from './track';

const { colors } = theme;

/** When the sleigh last left the station, and how full the cheer meter is. */
let ride: Ride = WAITING;

/** A sleigh-ride roller coaster that loops over a snowy hill. */
const attraction: NorthPoleSquare = {
  id: 'sleigh-coaster',
  name: 'Sleigh-Ride Coaster',
  description: "Tap to launch Santa's sleigh up the hill and whoosh it down the other side.",
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'shed', roof: 'berry', trim: 'gold', landmark: 'coaster' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    ride = launch(ride, time, pointer?.presses ?? 0);
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

      drawLever(ctx, ridePoint(12, near + 3, 99), !riding(ride, time), time);
      drawCheerMeter(ctx, ride.cheers, time);
      drawSleigh(ctx, sleighPose(rideTime(ride, time), near), handsUp(ride, time));
    });
  },
};

export default attraction;
