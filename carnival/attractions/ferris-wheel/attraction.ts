/**
 * The Ferris Wheel: the wheel turns slowly, and a tap on a car boards it, so
 * the wheel carries it to the top and the view opens out over the town.
 */
import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { box, glow, iso, scene, shadow, stringLights } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { baubleOf, board, canBoard, carAt, CARS, carSpots, wheelAngle, viewOpen } from './ride';
import type { Ride } from './ride';
import { drawView } from './view';

const { colors } = theme;

const BAUBLES = [colors.berry, colors.gold, colors.mint, colors.violet];

/** The ride a visitor last boarded, if any: the attraction's one memory of the pointer. */
let ride: Ride | undefined;

/** A ferris wheel hung with bauble cars under the northern lights: tap one to ride it to the top. */
const attraction: NorthPoleSquare = {
  id: 'ferris-wheel',
  name: 'Ferris Wheel',
  description: 'Tap a bauble car to ride it to the top and look out over the North Pole.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'stall', roof: 'violet', trim: 'snow', landmark: 'big-wheel' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    scene(ctx, size, time, () => {
      // The northern lights: two faint ribbons that ripple across the dusk.
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (const [color, base, speed] of [
        [colors.aurora, 10, 1500],
        [colors.violet, 17, 2100],
      ] as const) {
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = color;
        ctx.beginPath();
        for (let x = 0; x <= 100; x += 4) {
          const y = base + Math.sin(x / 14 + time / speed) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.lineCap = 'butt';

      const cx = 48;
      const cy = 40;
      const radius = 26;
      const depth = { x: 5, y: -2.5 };
      const foot = 74;

      // The base the wheel stands on.
      shadow(ctx, 52, foot + 3, 60);
      box(ctx, -12, -9, 24, 18, 3, colors.slab, colors.surface, colors.night);

      // A tap on a car boards it, unless a ride is already up at the top.
      const angle = wheelAngle(time, ride);
      const gondolas = carSpots(CARS, angle, cx, cy, radius);
      const over: number = pointer
        ? carAt((pointer.x * 100) / size, (pointer.y * 100) / size, gondolas)
        : -1;
      if (pointer && pointer.presses > 0 && over >= 0 && canBoard(time, ride)) {
        ride = board(over, time, ride);
      }
      const legs = (dx: number, dy: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx + dx - 18, foot + dy);
        ctx.lineTo(cx + dx, cy + dy);
        ctx.lineTo(cx + dx + 18, foot + dy);
        ctx.stroke();
      };
      const wheel = (dx: number, dy: number, rim: string, spokes: string) => {
        ctx.strokeStyle = spokes;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (const { x, y } of gondolas) {
          ctx.moveTo(cx + dx, cy + dy);
          ctx.lineTo(x + dx, y + dy);
        }
        ctx.stroke();
        ctx.strokeStyle = rim;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, radius, 0, Math.PI * 2);
        ctx.stroke();
      };
      // The far legs and rim in the shade, the axle across, then the near ones.
      legs(depth.x, depth.y, colors.night);
      wheel(depth.x, depth.y, colors.mountain, colors.mountain);
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + depth.x, cy + depth.y);
      ctx.stroke();
      wheel(0, 0, colors.gold, colors.snowShade);
      legs(0, 0, colors.wood);

      // Lights round the rim, between the gondolas.
      stringLights(
        ctx,
        carSpots(CARS, angle + Math.PI / CARS, cx, cy, radius),
        [colors.lantern],
        time,
      );

      // Each gondola hangs straight down from the rim, like a bauble on a branch.
      const riding = ride && viewOpen(time, ride) === 0 && !canBoard(time, ride) ? ride.car : -1;
      gondolas.forEach((spot, i: number) => {
        const { x, y } = spot;
        const g = { x: x + depth.x / 2, y: y + depth.y / 2 };
        // A warm glow round the car under the pointer, and round the one rising.
        if (i === over || i === riding) {
          const bauble = baubleOf(spot);
          glow(ctx, bauble.x, bauble.y, 9, 0.8);
        }
        ctx.strokeStyle = colors.snowShade;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.x, g.y + 2.5);
        ctx.stroke();
        ctx.fillStyle = colors.gold;
        ctx.fillRect(g.x - 1.2, g.y + 2, 2.4, 1.6);
        ctx.fillStyle = BAUBLES[i % BAUBLES.length];
        ctx.beginPath();
        ctx.arc(g.x, g.y + 6.6, 3.6, 0, Math.PI * 2);
        ctx.fill();
        // Shaded on the right, and a highlight where the light falls on the upper left.
        ctx.fillStyle = colors.shadow;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(g.x, g.y + 6.6, 3.6, -Math.PI / 3, (2 * Math.PI) / 3);
        ctx.fill();
        ctx.fillStyle = colors.snowLit;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(g.x - 1.2, g.y + 5.4, 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      ctx.fillStyle = colors.berry;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.4, 0, Math.PI * 2);
      ctx.fill();
      // A warm lamp at the foot of the wheel.
      const lamp = iso(-14, 10);
      glow(ctx, lamp.x, lamp.y - 10, 14, 0.85);
      ctx.fillStyle = colors.ink;
      ctx.fillRect(lamp.x - 0.5, lamp.y - 12, 1, 12);
      ctx.fillStyle = colors.lantern;
      ctx.fillRect(lamp.x - 1.4, lamp.y - 15, 2.8, 3);

      // At the top, the view opens out from the boarded car.
      const top = ride ? gondolas.at(ride.car) : undefined;
      if (ride && top) drawView(ctx, time, viewOpen(time, ride), baubleOf(top).x, baubleOf(top).y);
    });
  },
};

export default attraction;
