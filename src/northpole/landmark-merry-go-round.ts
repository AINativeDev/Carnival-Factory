/**
 * The Reindeer Carousel stands as a big merry-go-round: reindeer rising and
 * falling on gold poles round a mirrored drum, under a striped canopy with a
 * lit valance. It turns once every twenty seconds, a calm pace for the midway.
 * Its square's drawing hangs on the crest board over the canopy's front, the
 * way a carousel shows its name (ADR 0042).
 */
import { bulb, corners, middle, twinkle } from './brushes';
import { framedArt, frontOf, inset, stage, type LandmarkDrawer } from './landmark-parts';
import { pennant } from './landmark-kit';
import { inTurn } from './rounds';
import { standing } from './stall-plan';
import { theme } from './theme';

const { colors } = theme;

/** The ride's size in world pixels, and how long one turn takes. */
const RIDE = { rx: 86, ry: 43, deck: 14, poles: 108, canopy: 70, drum: 20, turn: 20_000 };
const COATS = [colors.cocoa, colors.gingerbread, colors.wood, colors.snowShade] as const;
const REINDEER = 8;

/** An upright round drum `tall` high on the ellipse at `x`, `y`: its side and then its top. */
function drum(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  tall: number,
  side: string,
  top: string,
) {
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI);
  ctx.lineTo(x - rx, y - tall);
  ctx.ellipse(x, y - tall, rx, ry, 0, Math.PI, 0, true);
  ctx.fill();
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.ellipse(x, y - tall, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** One reindeer on its pole, facing the way it goes round, its legs mid-gallop. */
function reindeer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  coat: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * 1.25, 1.25);
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(15, -9, 6, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(9, -9, 5, 8);
  ctx.fillRect(-11, 3, 3, 10);
  ctx.fillRect(8, 3, 3, 10);
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(13, -12);
  ctx.lineTo(10, -21);
  ctx.lineTo(6, -23);
  ctx.moveTo(10, -18);
  ctx.lineTo(14, -22);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.berry;
  ctx.fillRect(-5, -8, 9, 4);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-1, -8, 2, 4);
  ctx.restore();
}

export const drawMerryGoRound: LandmarkDrawer = (ctx, plot, square, paint, time) => {
  const { x } = middle(plot);
  const base = stage(ctx, plot, 84).y - 10;
  drum(ctx, x, base, RIDE.rx, RIDE.ry, RIDE.deck, colors.slabShade, colors.snowShade);
  const floor = base - RIDE.deck;
  const rim = floor - RIDE.poles;
  const turn = ((time / RIDE.turn) % 1) * Math.PI * 2;
  const riders = Array.from({ length: REINDEER }, (_, n) => {
    const angle = turn + (n / REINDEER) * Math.PI * 2;
    return { n, angle, bob: Math.sin(angle * 2 + n) * 7 };
  });
  // Behind the drum first, then the drum, then the reindeer passing in front of it.
  const ride = (front: boolean) => {
    for (const { n, angle, bob } of riders) {
      if (Math.sin(angle) >= 0 !== front) continue;
      const rx = x + Math.cos(angle) * RIDE.rx * 0.74;
      const ry = floor + Math.sin(angle) * RIDE.ry * 0.74;
      ctx.fillStyle = colors.gold;
      ctx.fillRect(rx - 1.5, rim, 3, ry - rim);
      reindeer(ctx, rx, ry - 34 + bob, Math.sin(angle) >= 0 ? -1 : 1, inTurn(COATS, n));
    }
  };
  ride(false);
  drum(ctx, x, floor, RIDE.drum, RIDE.drum / 2, RIDE.poles, colors.gold, colors.cream);
  // Mirrored panels round the drum, glinting warm.
  for (let n = -2; n <= 2; n++) {
    const px = x + n * 7.5;
    ctx.fillStyle = colors.glow;
    ctx.globalAlpha = 0.6 + 0.3 * Math.sin(time / 900 + n);
    ctx.fillRect(px - 2.5, floor - RIDE.poles + 14, 5, RIDE.poles - 24);
    ctx.globalAlpha = 1;
  }
  ride(true);
  // The canopy: a striped cone, the far half first so the near half covers it.
  const slices = 16;
  const tip = { x, y: rim - RIDE.canopy };
  for (let m = 0; m < slices * 2; m++) {
    const n = (m + slices) % (slices * 2);
    const a = (n / slices) * Math.PI;
    const b = ((n + 1) / slices) * Math.PI;
    ctx.fillStyle = n % 2 ? colors.snow : colors.berry;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(x + Math.cos(a) * (RIDE.rx + 6), rim + Math.sin(a) * (RIDE.ry + 3));
    ctx.lineTo(x + Math.cos(b) * (RIDE.rx + 6), rim + Math.sin(b) * (RIDE.ry + 3));
    ctx.fill();
  }
  // The right of the cone in the dusk's shade.
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(x + RIDE.rx + 6, rim);
  ctx.lineTo(x + (RIDE.rx + 6) * 0.2, rim + RIDE.ry + 3);
  ctx.fill();
  ctx.globalAlpha = 1;
  // The valance round the near rim, scalloped, with bulbs along it.
  for (let n = 0; n <= 20; n++) {
    const a = (n / 20) * Math.PI;
    const at = { x: x + Math.cos(a) * (RIDE.rx + 6), y: rim + Math.sin(a) * (RIDE.ry + 3) };
    ctx.fillStyle = inTurn([colors.gold, colors.berry], n);
    ctx.beginPath();
    ctx.arc(at.x, at.y, 5, 0, Math.PI);
    ctx.fill();
    bulb(ctx, at.x, at.y - 2, colors.lantern, twinkle(time, n * 2.3));
  }
  pennant(ctx, tip, 22, colors.gold, time);
  // The crest board over the canopy's front, out at the rim.
  const crest = frontOf(plot, inset(plot, 0.5));
  framedArt(ctx, crest, square, paint, {
    from: 0.1,
    to: 0.9,
    low: middle(plot).y - rim - 14,
    outward: 0.85,
  });
  return standing(plot, corners(plot).top.y - tip.y + 30);
};
