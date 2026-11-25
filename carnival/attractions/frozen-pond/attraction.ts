import type { NorthPoleSquare } from '../../../src/northpole/square';
import { glow, iso, pine, scene, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

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

function skater(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, scarf: string) {
  ctx.fillStyle = colors.surface;
  ctx.fillRect(x - 2 * u, y - 8 * u, 4 * u, 8 * u);
  ctx.fillStyle = scarf;
  ctx.fillRect(x - 2.5 * u, y - 8.5 * u, 5 * u, 1.6 * u);
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x, y - 10.5 * u, 2.2 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = scarf;
  ctx.beginPath();
  ctx.arc(x, y - 11.5 * u, 2.2 * u, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = colors.muted;
  ctx.fillRect(x - 2.5 * u, y, 5 * u, 0.8 * u);
}

/** A frozen pond in the pines, where skaters trace figure eights and leave their tracks in the ice. */
const attraction: NorthPoleSquare = {
  id: 'frozen-pond',
  name: 'Frozen Pond',
  description: 'Skaters tracing figure eights on the ice.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'igloo', roof: 'ice', trim: 'snow', landmark: 'ice-rink' },
  draw(ctx, size, time) {
    scene(ctx, size, time, () => {
      // Pines round the back of the pond.
      for (const [gx, gy, h] of [
        [-20, -14, 20],
        [-13, -20, 15],
        [-19, -4, 13],
        [16, -20, 17],
      ]) {
        const p = iso(gx, gy);
        pine(ctx, p.x, p.y, h);
      }

      // The ice, sunk a little into the snow, with a shine that drifts across it.
      const cx = 52;
      const cy = 70;
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
      const across = 25;
      const down = 22;
      ctx.strokeStyle = colors.snowLit;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const { x, y } = figureEight(i / 64);
        if (i === 0) ctx.moveTo(cx + x * across, cy + y * down);
        else ctx.lineTo(cx + x * across, cy + y * down);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Three skaters, a third of a lap apart, the nearer ones drawn last.
      const skaters = SCARVES.map((scarf, i) => ({
        scarf,
        ...figureEight((((time / LAP + i / 3) % 1) + 1) % 1),
      })).sort((a, b) => a.y - b.y);
      for (const { scarf, x, y } of skaters) {
        shadow(ctx, cx + x * across, cy + y * down, 6);
        skater(ctx, cx + x * across, cy + y * down, 0.9, scarf);
      }
    });
  },
};

export default attraction;
