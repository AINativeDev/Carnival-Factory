/**
 * The Hot Cocoa Stand stands as a small round hut of logs under a striped
 * cone roof, with a giant mug of cocoa on top and steam rising softly from it,
 * so it reads as cocoa from across the map. A lit hatch serves from the front,
 * over a counter whose board shows the square's drawing (ADR 0042).
 */
import { corners, glow } from './brushes';
import { band, onFace, type Face } from './faces';
import { framedArt, frontOf, stage, type LandmarkDrawer } from './landmark-parts';
import { onSpot } from './landmark-kit';
import { SIGN_STYLES } from './sign-styles';
import { standing } from './stall-plan';
import { peakedRoof, prism } from './stall-volumes';
import { theme } from './theme';
import type { Spot, Tile } from './world';

const { colors } = theme;

const HUT = { stage: 10, wall: 122, rise: 34, radius: 0.4, eaves: 0.47 };
const MUG = { rx: 32, ry: 13, tall: 54 };

/** The hut's outline, `r` of the spot out from its middle. */
const ring = (spot: Spot, r: number): Tile[] =>
  Array.from({ length: 16 }, (_, n) => {
    const angle = (n / 16) * Math.PI * 2;
    return onSpot(spot, 0.5 + Math.cos(angle) * r, 0.5 + Math.sin(angle) * r);
  });

/** The giant mug, standing on the roof's peak at `foot`: its body, its band, its handle, cocoa and marshmallows. */
function mug(ctx: CanvasRenderingContext2D, foot: Tile) {
  const { rx, ry, tall } = MUG;
  const top = foot.y - tall;
  ctx.strokeStyle = colors.cream;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(foot.x + rx, foot.y - tall / 2, 16, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.ellipse(foot.x, foot.y, rx, ry, 0, 0, Math.PI);
  ctx.lineTo(foot.x - rx, top);
  ctx.ellipse(foot.x, top, rx, ry, 0, Math.PI, 0, true);
  ctx.fill();
  // The berry band round its middle, and its right side in the dusk's shade.
  ctx.fillStyle = colors.berry;
  ctx.fillRect(foot.x - rx, top + tall * 0.45 + ry * 0.4, rx * 2, 8);
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(foot.x + rx * 0.2, top, rx * 0.8, tall + ry * 0.6);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.ellipse(foot.x, top, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.ellipse(foot.x, top + 1.5, rx - 4, ry - 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  for (const [dx, dy] of [
    [-9, -1],
    [3, -3],
    [8, 2],
    [-2, 3],
  ] as const)
    ctx.fillRect(foot.x + dx - 3, top + dy - 3, 6, 6);
}

/** Steam rising from the cocoa: three soft wisps, each a trail of puffs growing and fading. */
function steam(ctx: CanvasRenderingContext2D, from: Tile, time: number) {
  ctx.fillStyle = colors.snow;
  for (let wisp = 0; wisp < 3; wisp++)
    for (let n = 0; n < 4; n++) {
      const age = (time / 3600 + n / 4 + wisp / 3) % 1;
      ctx.globalAlpha = 0.4 * (1 - age);
      ctx.beginPath();
      ctx.arc(
        from.x + (wisp - 1) * 9 + Math.sin(age * 5 + wisp) * 5,
        from.y - age * 56,
        3 + age * 6,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  ctx.globalAlpha = 1;
}

export const drawCocoaHut: LandmarkDrawer = (ctx, spot, square, paint, time) => {
  stage(ctx, spot, 72);
  prism(
    ctx,
    ring(spot, HUT.radius),
    HUT.wall,
    undefined,
    colors.wood,
    colors.cocoa,
    HUT.stage,
    true,
  );
  const out = frontOf(spot).out;
  // The lit hatch high on the front, its glow spilling out.
  const front: Face = { a: onSpot(spot, 0.33, 0.12), b: onSpot(spot, 0.67, 0.12), out };
  const hatch = onFace(front, 0.5, 106);
  glow(ctx, hatch.x, hatch.y, 40, 0.9);
  ctx.fillStyle = colors.glow;
  band(ctx, front, 0.08, 0.92, 96, 118);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  band(ctx, front, 0.02, 0.98, 92, 96, 0.1);
  ctx.fill();
  // The counter board in front, with the square's drawing and the stand's name.
  const counter: Face = { a: onSpot(spot, 0.2, 0.05), b: onSpot(spot, 0.8, 0.05), out };
  ctx.fillStyle = colors.wood;
  band(ctx, counter, 0, 1, HUT.stage, 90);
  ctx.fill();
  framedArt(ctx, counter, square, paint, { from: 0.08, to: 0.92, low: 12 }, SIGN_STYLES.cabin);
  const eaves = HUT.stage + HUT.wall;
  peakedRoof(ctx, ring(spot, HUT.eaves), eaves, HUT.rise, [colors.berry, colors.cream]);
  const peak = onSpot(spot, 0.5, 0.5, eaves + HUT.rise - 6);
  mug(ctx, peak);
  steam(ctx, { x: peak.x, y: peak.y - MUG.tall - 4 }, time);
  return standing(spot, corners(spot).top.y - (peak.y - MUG.tall - 70));
};
