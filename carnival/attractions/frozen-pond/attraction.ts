import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { glow, iso, pine, scene } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { drawSkater, drawSparkle, drawTrail } from './rink-drawing';
import { ICE, skate, sparkle, spinning, startRink } from './skate';

const { colors } = theme;

/** One figure eight, in milliseconds. */
export const LAP = 8_000;

/**
 * A point on a figure eight at `phase` (one lap from 0 to 1), from -1 to 1
 * across and -0.5 to 0.5 down, crossing itself in the middle.
 */
export function figureEight(phase: number): { x: number; y: number } {
  const angle = phase * Math.PI * 2;
  return { x: Math.sin(angle), y: Math.sin(angle * 2) / 2 };
}

const SCARVES = [colors.berry, colors.pine, colors.violet];

/** Across and down the figure eight's lane, in the attraction's units. */
const ACROSS = 25;
const DOWN = 22;

/** Where on the lane a skater is at `time`, `ahead`, a part of a lap, in front of the first. */
function onLane(time: number, ahead: number) {
  const { x, y } = figureEight((((time / LAP + ahead) % 1) + 1) % 1);
  return { x: ICE.x + x * ACROSS, y: ICE.y + y * DOWN };
}

/** The visitor's skater: the attraction's one memory of the pointer. */
let rink = startRink();

/**
 * A frozen pond in the pines, where three skaters trace figure eights and a
 * gold-scarfed one follows the pointer, carving lines in the ice, spinning on
 * a tap and sparkling for a figure eight of the visitor's own.
 */
const attraction: NorthPoleSquare = {
  id: 'frozen-pond',
  name: 'Frozen Pond',
  description: 'Skate the ice: carve trails, spin on a tap and sparkle for a figure eight.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'igloo', roof: 'ice', trim: 'snow', landmark: 'ice-rink' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    scene(ctx, size, time, () => {
      // Pines round the back of the pond.
      const pines: [number, number, number][] = [
        [-20, -14, 20],
        [-13, -20, 15],
        [-19, -4, 13],
        [16, -20, 17],
      ];
      for (const [gx, gy, h] of pines) {
        const p = iso(gx, gy);
        pine(ctx, p.x, p.y, h);
      }

      // The ice, sunk a little into the snow, with a shine that drifts across it.
      const cx = ICE.x;
      const cy = ICE.y;
      ctx.fillStyle = colors.slabShade;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 33, 15.5, 0, 0, Math.PI * 2);
      ctx.fill();
      const ice = ctx.createLinearGradient(cx - 30, cy - 14, cx + 30, cy + 14);
      ice.addColorStop(0, colors.ice);
      ice.addColorStop(1, colors.mountainFar);
      ctx.fillStyle = ice;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 0.8, 31.5, 14.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = colors.snowLit;
      const shine = ((time / 60) % 140) - 20;
      ctx.beginPath();
      ctx.moveTo(shine, cy - 16);
      ctx.lineTo(shine + 6, cy - 16);
      ctx.lineTo(shine - 8, cy + 16);
      ctx.lineTo(shine - 14, cy + 16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // A lamp by the pond, throwing a warm pool on the ice.
      const lamp = iso(-8, 18);
      glow(ctx, lamp.x + 4, lamp.y - 6, 16, 0.85);
      ctx.fillStyle = colors.ink;
      ctx.fillRect(lamp.x - 0.5, lamp.y - 16, 1, 16);
      ctx.fillStyle = colors.lantern;
      ctx.fillRect(lamp.x - 1.4, lamp.y - 19, 2.8, 3);

      // The figure eight scratched into the ice.
      ctx.strokeStyle = colors.snowLit;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const { x, y } = onLane(i * (LAP / 64), 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // The visitor's skater glides after the pointer, or skates the lane between the others.
      const u = size / 100;
      const target = pointer ? { x: pointer.x / u, y: pointer.y / u } : onLane(time, 1 / 6);
      rink = skate(rink, target, time, pointer?.presses ?? 0);
      drawTrail(ctx, rink.trail, time);

      // Four skaters, the nearer ones drawn last.
      const skaters = [
        ...SCARVES.map((scarf, i: number) => ({ scarf, spin: 0, ...onLane(time, i / 3) })),
        { scarf: colors.gold, spin: spinning(rink, time) ?? 0, x: rink.x, y: rink.y },
      ].sort((a, b) => a.y - b.y);
      for (const { scarf, spin, x, y } of skaters) drawSkater(ctx, x, y, scarf, spin);
      drawSparkle(ctx, rink.x, rink.y, sparkle(rink, time));
    });
  },
};

export default attraction;
