/**
 * Santa's Big Top stands as a circus tent: striped walls round a long oval,
 * a roof rising to two peaks with a sag of canvas between them, flags on both
 * and the entrance flaps tied back at the front. Its square's drawing hangs
 * on the marquee over the entrance, where a circus puts its bill (ADR 0042).
 */
import { bulb, corners, quad, twinkle } from './brushes';
import type { Face } from './faces';
import { framedArt, frontOf, stage, type LandmarkDrawer } from './landmark-parts';
import { fillShape, pennant, onSpot } from './landmark-kit';
import { SIGN_STYLES } from './sign-styles';
import { inTurn } from './rounds';
import { standing } from './stall-plan';
import { peakedRoof, prism } from './stall-volumes';
import { theme } from './theme';
import type { Plot, Tile } from './world';

const { colors } = theme;

/** The tent's plan, in fractions of the plot: its two poles, one behind the other, and how round its ends are. */
const TENT = { poles: [0.36, 0.64] as const, radius: 0.33, wall: 60, rise: 104, sag: 30 };
const STAGE = 10;
const STRIPES = [colors.berry, colors.cream] as const;

/** A point on the ring `r` round the pole `deep` back, `angle` round from its right. */
const ringPoint = (plot: Plot, deep: number, r: number, angle: number) =>
  onSpot(plot, 0.5 + Math.cos(angle) * r, deep + Math.sin(angle) * r);

const lerp = (p: Tile, q: Tile, t: number): Tile => ({
  x: p.x + (q.x - p.x) * t,
  y: p.y + (q.y - p.y) * t,
});

/** The canvas sagging between the peaks down to the wall on one side, `edge` along the front, in stripes. */
function saddle(ctx: CanvasRenderingContext2D, plot: Plot, edge: number, eaves: number) {
  const [front, back] = TENT.poles;
  const peak = (deep: number) => onSpot(plot, 0.5, deep, eaves + TENT.rise);
  const dip = onSpot(plot, 0.5, 0.5, eaves + TENT.rise - TENT.sag);
  const foot = [onSpot(plot, edge, front, eaves), onSpot(plot, edge, back, eaves)] as const;
  const top = (t: number) =>
    t < 0.5 ? lerp(peak(front), dip, t * 2) : lerp(dip, peak(back), t * 2 - 1);
  for (let k = 0; k < 6; k++) {
    const [t, u] = [k / 6, (k + 1) / 6];
    fillShape(ctx, [top(t), top(u), lerp(...foot, u), lerp(...foot, t)], inTurn(STRIPES, k));
  }
  // The side facing right is in the dusk's shade.
  if (edge > 0.5) {
    ctx.fillStyle = colors.night;
    ctx.globalAlpha = 0.2;
    quad(ctx, [peak(front), dip, peak(back), ...[...foot].reverse()]);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export const drawBigTop: LandmarkDrawer = (ctx, plot, square, paint, time) => {
  stage(ctx, plot, 86);
  const [front, back] = TENT.poles;
  const { radius: r } = TENT;
  // The walls: round the front end, along one side, round the back end and along the other.
  const ground: Tile[] = [];
  for (let n = 0; n <= 12; n++)
    ground.push(ringPoint(plot, front, r, Math.PI + (n / 12) * Math.PI));
  for (let n = 0; n <= 12; n++) ground.push(ringPoint(plot, back, r, (n / 12) * Math.PI));
  const stripe = (n: number) => inTurn(STRIPES, n);
  prism(ctx, ground, TENT.wall, undefined, stripe, stripe, STAGE, true);
  // The roof, back to front: the canvas on the far side, the two cones, the canvas on the near side.
  const eaves = STAGE + TENT.wall;
  const far = onSpot(plot, 0.5 - r, 0.5).y < onSpot(plot, 0.5 + r, 0.5).y ? 0.5 - r : 0.5 + r;
  saddle(ctx, plot, far, eaves);
  for (const deep of [back, front])
    peakedRoof(
      ctx,
      Array.from({ length: 16 }, (_, n) => ringPoint(plot, deep, r + 0.05, (n / 16) * Math.PI * 2)),
      eaves,
      TENT.rise,
      [colors.berry, colors.snow],
    );
  saddle(ctx, plot, 1 - far, eaves);
  const peaks = [back, front].map((deep) => onSpot(plot, 0.5, deep, eaves + TENT.rise));
  for (const peak of peaks) pennant(ctx, peak, 26, colors.gold, time);
  // Lights round the front's eaves.
  for (let n = 0; n <= 10; n++) {
    const at = ringPoint(plot, front, r + 0.05, Math.PI + (n / 10) * Math.PI);
    bulb(ctx, at.x, at.y - eaves + 3, colors.lantern, twinkle(time, n * 1.9));
  }
  const entry = front - r;
  // The entrance: a dark way in on the front wall, its flaps tied back either side.
  const out = frontOf(plot).out;
  const door = { a: onSpot(plot, 0.42, entry), b: onSpot(plot, 0.58, entry) };
  fillShape(
    ctx,
    [
      { x: door.a.x, y: door.a.y - STAGE },
      { x: door.b.x, y: door.b.y - STAGE },
      { x: door.b.x, y: door.b.y - 56 },
      lerp({ x: door.a.x, y: door.a.y - 66 }, { x: door.b.x, y: door.b.y - 66 }, 0.5),
      { x: door.a.x, y: door.a.y - 56 },
    ],
    colors.night,
  );
  for (const [edge, inward] of [
    [door.a, 1],
    [door.b, -1],
  ] as const)
    fillShape(
      ctx,
      [
        { x: edge.x, y: edge.y - STAGE },
        { x: edge.x, y: edge.y - 60 },
        { x: edge.x - inward * 8, y: edge.y - STAGE },
      ],
      colors.cream,
    );
  // The marquee on two gold posts, just out from the wall.
  const marquee: Face = {
    a: onSpot(plot, 0.18, entry - 0.04),
    b: onSpot(plot, 0.82, entry - 0.04),
    out,
  };
  ctx.fillStyle = colors.gold;
  for (const end of [marquee.a, marquee.b]) ctx.fillRect(end.x - 2, end.y - 72, 4, 72 - STAGE);
  framedArt(ctx, marquee, square, paint, { from: 0.06, to: 0.94, low: 72 }, SIGN_STYLES.tent);
  return standing(plot, corners(plot).top.y - Math.min(...peaks.map((p) => p.y)) + 34);
};
