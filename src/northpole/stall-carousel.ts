/**
 * The carousel stall: a small round carousel on a wooden deck, a gold centre
 * column, horses on gold poles going slowly round (once in 30 seconds) and
 * gently rising and falling, under a striped valance and conical canopy in the
 * stall's roof and trim colours, with bulbs along its edge. The drawing stands
 * on a board before it, as on the tent.
 */
import { bulb, quad, twinkle } from './brushes';
import { band } from './faces';
import { stallFront } from './stall-front';
import { plotPoint, STALL, type StallParts } from './stall-plan';
import { peakedRoof, prism } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** How high the deck stands, and how deep the valance hangs. */
const DECK = 10;
const VALANCE = 10;
/** How many horses go round, how far out, and how long one turn takes, in milliseconds. */
const HORSES = 6;
const RIDE = 0.32;
const TURN = 30_000;

/** One horse on its pole, where it stands on the screen now. */
interface Horse {
  foot: Tile;
  rise: number;
  facing: number;
}

/** The carousel: deck, horses behind the column, the column, horses before it, canopy, then the board. */
export function drawCarouselStall(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, ground, wall, roof, look, square, paint, owner, time } = parts;
  const centre = plotPoint(face, deep, { along: 0.5, depth: 0.5 });
  prism(ctx, ground, DECK, colors.slab, colors.gingerbread, colors.wood);
  const horses: Horse[] = Array.from({ length: HORSES }, (_, k) => {
    const angle = (time / TURN) * Math.PI * 2 + (k / HORSES) * Math.PI * 2;
    const foot = plotPoint(face, deep, {
      along: 0.5 + Math.cos(angle) * RIDE,
      depth: 0.5 + Math.sin(angle) * RIDE,
    });
    return { foot, rise: Math.sin(time / 1400 + k * 2) * 4, facing: foot.y < centre.y ? -1 : 1 };
  }).sort((a, b) => a.foot.y - b.foot.y);
  const behind = horses.filter((horse) => horse.foot.y < centre.y);
  const before = horses.filter((horse) => horse.foot.y >= centre.y);
  behind.forEach((horse, k) => {
    drawHorse(ctx, horse, wall, look.roof, k);
  });
  prism(
    ctx,
    shrunk(ground, centre, 0.2),
    wall - DECK,
    undefined,
    colors.gold,
    colors.gingerbread,
    DECK,
  );
  before.forEach((horse, k) => {
    drawHorse(ctx, horse, wall, look.roof, k + 1);
  });
  const rim = shrunk(ground, centre, 1.04);
  const stripe = (n: number) => (n % 2 ? look.trim : look.roof);
  prism(ctx, rim, VALANCE, undefined, stripe, stripe, wall, true);
  peakedRoof(ctx, rim, wall + VALANCE, roof - VALANCE, [look.roof, look.trim]);
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(centre.x, centre.y - wall - roof - 3, 3.5, 0, Math.PI * 2);
  ctx.fill();
  rim
    .filter((p) => p.y > centre.y)
    .forEach((p, n) => {
      bulb(ctx, p.x, p.y - wall, n % 2 ? colors.gold : colors.glow, twinkle(time, n));
    });
  ctx.fillStyle = colors.cocoa;
  band(ctx, face, 0.03, 0.97, 0, STALL.wall);
  ctx.fill();
  stallFront(ctx, face, square, paint, owner);
}

/** An outline drawn in towards `centre`, or out from it, by `scale`. */
function shrunk(points: Tile[], centre: Tile, scale: number): Tile[] {
  return points.map((p) => ({
    x: centre.x + (p.x - centre.x) * scale,
    y: centre.y + (p.y - centre.y) * scale,
  }));
}

/** A horse on its gold pole: a cream body with a saddle in `saddle`, its head turned the way it goes. */
function drawHorse(
  ctx: CanvasRenderingContext2D,
  horse: Horse,
  wall: number,
  saddle: string,
  k: number,
) {
  const { foot, rise, facing } = horse;
  ctx.fillStyle = colors.gold;
  ctx.fillRect(foot.x - 1, foot.y - wall, 2, wall - DECK);
  const body = { x: foot.x, y: foot.y - 34 - rise };
  ctx.fillStyle = k % 2 ? colors.cream : colors.snowLit;
  ctx.beginPath();
  ctx.ellipse(body.x, body.y, 8, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  quad(ctx, [
    { x: body.x + 5 * facing, y: body.y - 2 },
    { x: body.x + 10 * facing, y: body.y - 9 },
    { x: body.x + 12 * facing, y: body.y - 6 },
    { x: body.x + 8 * facing, y: body.y + 1 },
  ]);
  ctx.fill();
  ctx.fillRect(body.x - 6, body.y + 2, 2, 6);
  ctx.fillRect(body.x + 4, body.y + 2, 2, 6);
  ctx.fillStyle = saddle;
  ctx.fillRect(body.x - 3, body.y - 4.5, 6, 3);
}
