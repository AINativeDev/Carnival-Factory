/**
 * The Sleigh-Ride Coaster stands as a loop of track on wooden trestles, rising
 * to a tall hill at the back and smaller ones to either side, with two sleighs
 * running round it, one lap every eighteen seconds. Everything is drawn back
 * to front, posts, track and sleighs together, so the near track passes in
 * front of the far. Its square's drawing hangs on a sign at the spot's front
 * (ADR 0042).
 */
import { bulb, corners, twinkle } from './brushes';
import { signPost, stage, type LandmarkDrawer } from './landmark-parts';
import { backToFront, fillShape } from './landmark-kit';
import { standing } from './stall-plan';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** The loop: its radius in tiles, how many pieces it's drawn in, how long a lap takes. */
const LOOP = { radius: 1.2, pieces: 56, lap: 18_000 };
/** The hills, by where they are round the loop and how high and wide: the big one at the back. */
const HILLS = [
  { at: (Math.PI * 5) / 4, high: 118, wide: 0.85 },
  { at: -Math.PI / 4, high: 58, wide: 0.5 },
  { at: (Math.PI * 3) / 4, high: 40, wide: 0.45 },
] as const;
const STAGE = 10;

/** How high the track is at `angle` round the loop, in world pixels. */
function trackHeight(angle: number): number {
  return HILLS.reduce((sum, hill) => {
    const off = Math.atan2(Math.sin(angle - hill.at), Math.cos(angle - hill.at));
    return sum + hill.high * Math.exp(-((off / hill.wide) ** 2));
  }, 18);
}

/** Where the loop is at `angle`: its foot on the stage and its track up on the trestles. */
function onLoop(mid: Tile, angle: number): { foot: Tile; track: Tile } {
  const dx = Math.cos(angle) * LOOP.radius;
  const dy = Math.sin(angle) * LOOP.radius;
  const foot = { x: mid.x + (dx - dy) * 32, y: mid.y + (dx + dy) * 16 - STAGE };
  return { foot, track: { x: foot.x, y: foot.y - trackHeight(angle) } };
}

/** A sleigh on the track: a red body with a curled gold runner, tipped to the track's slope. */
function sleigh(ctx: CanvasRenderingContext2D, at: Tile, ahead: Tile) {
  const facing = ahead.x < at.x ? -1 : 1;
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(facing, 1);
  ctx.rotate(Math.atan2(ahead.y - at.y, Math.abs(ahead.x - at.x)));
  fillShape(
    ctx,
    [
      { x: -11, y: -3 },
      { x: 9, y: -3 },
      { x: 13, y: -12 },
      { x: 8, y: -13 },
      { x: 4, y: -8 },
      { x: -11, y: -10 },
    ],
    colors.berry,
  );
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, -1);
  ctx.lineTo(10, -1);
  ctx.arc(10, -5, 4, Math.PI / 2, -Math.PI / 2, true);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.arc(-4, -14, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const drawCoaster: LandmarkDrawer = (ctx, spot, square, paint, time) => {
  const mid = stage(ctx, spot, 84);
  type Piece = { y: number; draw: () => void };
  const pieces: Piece[] = [];
  for (let n = 0; n < LOOP.pieces; n++) {
    const from = onLoop(mid, (n / LOOP.pieces) * Math.PI * 2);
    const to = onLoop(mid, ((n + 1) / LOOP.pieces) * Math.PI * 2);
    pieces.push({
      y: (from.foot.y + to.foot.y) / 2,
      draw: () => {
        // A trestle under every other piece: a post and a brace.
        if (n % 2 === 0) {
          ctx.strokeStyle = colors.wood;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(from.foot.x, from.foot.y);
          ctx.lineTo(from.track.x, from.track.y);
          ctx.lineTo(to.foot.x, to.foot.y);
          ctx.stroke();
        }
        ctx.strokeStyle = colors.surface;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(from.track.x, from.track.y);
        ctx.lineTo(to.track.x, to.track.y);
        ctx.stroke();
        ctx.strokeStyle = colors.berry;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
        if (n % 4 === 0)
          bulb(ctx, from.track.x, from.track.y + 4, colors.lantern, twinkle(time, n));
      },
    });
  }
  // Two sleighs half a lap apart, slipping in among the track pieces by depth.
  const lap = ((time / LOOP.lap) % 1) * Math.PI * 2;
  for (const start of [0, Math.PI]) {
    const here = onLoop(mid, lap + start);
    const ahead = onLoop(mid, lap + start + 0.08);
    pieces.push({
      y: here.foot.y + 0.5,
      draw: () => {
        sleigh(ctx, here.track, ahead.track);
      },
    });
  }
  for (const piece of backToFront(pieces, (p) => p.y)) piece.draw();
  signPost(ctx, spot, square, paint, { from: 0.18, to: 0.88, low: 14, outward: 0.15 });
  const crest = onLoop(mid, HILLS[0].at).track;
  return standing(spot, corners(spot).top.y - crest.y + 24);
};
