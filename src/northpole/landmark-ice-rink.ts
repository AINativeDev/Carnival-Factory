/**
 * The Frozen Pond stands as an open-air ice rink, not a building: an oval of
 * ice inside a low wooden rail, a few skaters gliding slowly round it and two
 * lamps at the back throwing warm light on the ice. It stays low, so the
 * midway's taller rides show over it. Its square's drawing hangs on a sign at
 * the front corner of the spot, clear of the ice (ADR 0042).
 */
import { glow } from './brushes';
import { signPost, stage, type LandmarkDrawer } from './landmark-parts';
import { backToFront, onSpot } from './landmark-kit';
import { standing } from './stall-plan';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** The rink's oval in world pixels, its rail's height and the lamps' height. */
const RINK = { rx: 80, ry: 40, rail: 12, lamp: 62 };
const STAGE = 10;

/** The skaters: how far out on the ice each goes round, how long a lap takes, where it starts, its coat. */
const SKATERS = [
  { reach: 0.78, lap: 26_000, start: 0, coat: colors.berry },
  { reach: 0.62, lap: 31_000, start: 2.1, coat: colors.pine },
  { reach: 0.7, lap: 23_000, start: 4.2, coat: colors.violet },
  { reach: 0.45, lap: 37_000, start: 1, coat: colors.gingerbread },
] as const;

/** A point on the oval `scale` of the way out, `angle` round it. */
const onOval = (mid: Tile, scale: number, angle: number): Tile => ({
  x: mid.x + Math.cos(angle) * RINK.rx * scale,
  y: mid.y + Math.sin(angle) * RINK.ry * scale,
});

/** Half the rail, the back half (`from` π) or the front (`from` 0): its posts and its top rail. */
function rail(ctx: CanvasRenderingContext2D, mid: Tile, from: number) {
  ctx.fillStyle = colors.cocoa;
  for (let n = 0; n <= 12; n++) {
    const at = onOval(mid, 1.06, from + (n / 12) * Math.PI);
    ctx.fillRect(at.x - 1.5, at.y - RINK.rail, 3, RINK.rail);
  }
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(mid.x, mid.y - RINK.rail, RINK.rx * 1.06, RINK.ry * 1.06, 0, from, from + Math.PI);
  ctx.stroke();
  ctx.lineWidth = 1;
}

/** A skater gliding, leaning into the turn, a scarf trailing behind. */
function skater(
  ctx: CanvasRenderingContext2D,
  at: Tile,
  facing: number,
  coat: string,
  time: number,
) {
  const stride = Math.sin(time / 600 + at.x) * 2.5;
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(facing, 1);
  ctx.rotate(0.12);
  ctx.fillStyle = colors.night;
  ctx.fillRect(-3 + stride, -8, 2, 8);
  ctx.fillRect(1 - stride, -8, 2, 8);
  ctx.fillStyle = coat;
  ctx.fillRect(-4, -18, 8, 11);
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.arc(0, -21, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(-3.5, -26, 7, 3);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-9, -17, 7, 2);
  ctx.restore();
}

export const drawIceRink: LandmarkDrawer = (ctx, spot, square, paint, time) => {
  const ground = stage(ctx, spot, 84);
  const mid = { x: ground.x, y: ground.y - STAGE };
  // Lamps at the back corners, lighting the ice.
  for (const along of [0.08, 0.92]) {
    const foot = onSpot(spot, along, 0.92, STAGE);
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(foot.x - 1.5, foot.y - RINK.lamp, 3, RINK.lamp);
    glow(ctx, foot.x, foot.y - RINK.lamp, 26, 0.9);
    ctx.fillStyle = colors.lantern;
    ctx.fillRect(foot.x - 3.5, foot.y - RINK.lamp - 6, 7, 8);
  }
  rail(ctx, mid, Math.PI);
  // The ice, with a sheen where the lamps catch it and the marks of skates.
  ctx.fillStyle = colors.ice;
  ctx.beginPath();
  ctx.ellipse(mid.x, mid.y, RINK.rx, RINK.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.ellipse(mid.x - 22, mid.y - 10, RINK.rx * 0.45, RINK.ry * 0.3, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.snow;
  for (const scale of [0.5, 0.72]) {
    ctx.beginPath();
    ctx.ellipse(mid.x, mid.y, RINK.rx * scale, RINK.ry * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // The skaters, the ones further back first; going round, they face the way they glide.
  const skaters = SKATERS.map((one) => {
    const angle = one.start + ((time / one.lap) % 1) * Math.PI * 2;
    return { ...one, angle, at: onOval(mid, one.reach, angle) };
  });
  for (const one of backToFront(skaters, (s) => s.at.y))
    skater(ctx, one.at, Math.sin(one.angle) > 0 ? -1 : 1, one.coat, time);
  rail(ctx, mid, 0);
  signPost(ctx, spot, square, paint, { from: 0.02, to: 0.52, low: 12, outward: 0.1 });
  // The lamps near the back corner stand highest.
  return standing(spot, RINK.lamp + 30);
};
