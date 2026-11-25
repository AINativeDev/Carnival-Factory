/**
 * Each stall shape a booth may choose, drawn on its plot: the market stall, the
 * shed, the tent and the kiosk here, the cabin in `stall-cabin.ts`. `drawStall`
 * looks the shape up in `STALL_BODIES` and draws its honours over whichever it
 * is, so a new shape is one more entry, not another branch.
 */
import { block, quad } from './brushes';
import { band } from './faces';
import type { StallShape } from './square';
import { drawCabinStall } from './stall-cabin';
import { drawIgloo } from './stall-igloo';
import { drawGazebo } from './stall-gazebo';
import { drawChalet } from './stall-chalet';
import { drawTreehouse } from './stall-treehouse';
import { drawWindmill } from './stall-windmill';
import { drawLighthouse } from './stall-lighthouse';
import { drawFoodTruck } from './stall-food-truck';
import { drawCarouselStall } from './stall-carousel';
import { drawTurret } from './stall-turret';
import { drawBarn } from './stall-barn';
import { drawPagoda } from './stall-pagoda';
import { awning, stallCounter, stallFront } from './stall-front';
import { plotPoint, STALL, stallOutline, type StallParts } from './stall-plan';
import { peakedRoof, prism } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** The market stall: a block with the counter out front under a striped awning. */
function drawMarketStall(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { plot, face, wall, look, square, paint, owner } = parts;
  block(ctx, plot, wall, colors.snowShade, colors.wood, colors.cocoa);
  stallFront(ctx, face, square, paint, owner);
  stallCounter(ctx, plot, face);
  awning(ctx, face, look.roof, look.trim);
}

/** The shed: plank walls under a flat roof hanging a little over them, with snow along its back. */
function drawShed(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, ground, wall, roof, look, square, paint, owner } = parts;
  prism(ctx, ground, wall, undefined, colors.wood, colors.cocoa);
  ctx.fillStyle = colors.cocoa;
  for (let k = 1; k < 5; k++) {
    band(ctx, face, 0, 1, (wall * k) / 5, (wall * k) / 5 + 1);
    ctx.fill();
  }
  stallFront(ctx, face, square, paint, owner);
  const eaves = stallOutline('shed').map((at) =>
    plotPoint(face, deep, {
      along: (at.along - 0.5) * 1.08 + 0.5,
      depth: (at.depth - 0.5) * 1.08 + 0.5,
    }),
  );
  prism(ctx, eaves, roof, look.roof, look.trim, colors.cocoa, wall);
  ctx.fillStyle = colors.snow;
  ctx.globalAlpha = 0.85;
  quad(
    ctx,
    [
      { along: -0.04, depth: 1.04 },
      { along: 1.04, depth: 1.04 },
      { along: 1.04, depth: 0.7 },
      { along: -0.04, depth: 0.78 },
    ].map((at) => plotPoint(face, deep, at, wall + roof)),
  );
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** The tent: canvas walls in stripes, a striped cone over them, and the front on a board. */
function drawTentStall(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, ground, wall, roof, look, square, paint, owner } = parts;
  const stripe = (n: number) => (n % 2 ? look.trim : look.roof);
  prism(ctx, ground, wall, undefined, stripe, stripe, 0, true);
  peakedRoof(ctx, ground, wall, roof, [look.roof, look.trim]);
  ctx.fillStyle = colors.cocoa;
  band(ctx, face, 0.03, 0.97, 0, STALL.wall);
  ctx.fill();
  stallFront(ctx, face, square, paint, owner);
  pennant(ctx, plotPoint(face, deep, { along: 0.5, depth: 0.5 }, wall + roof), look.trim);
}

/** The kiosk: six walls under wide eaves and a pointed roof with a gold finial. */
function drawKiosk(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { plot, face, deep, ground, wall, roof, look, square, paint, owner } = parts;
  prism(ctx, ground, wall, undefined, look.trim, colors.cocoa);
  const eaves = stallOutline('kiosk').map((at) =>
    plotPoint(face, deep, {
      along: (at.along - 0.5) * 1.15 + 0.5,
      depth: (at.depth - 0.5) * 1.15 + 0.5,
    }),
  );
  prism(ctx, eaves, 6, undefined, look.trim, colors.snowShade, wall);
  peakedRoof(ctx, eaves, wall + 6, roof, [look.roof]);
  const peak = plotPoint(face, deep, { along: 0.5, depth: 0.5 }, wall + 6 + roof);
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(peak.x, peak.y - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  // The front on a board after the roof, so the name board stands in front of the eaves, as on the tent.
  ctx.fillStyle = colors.cocoa;
  band(ctx, face, 0.03, 0.97, 0, STALL.wall);
  ctx.fill();
  stallFront(ctx, face, square, paint, owner);
  stallCounter(ctx, plot, face);
}

/** A small flag on a pole, rising from `at`. */
function pennant(ctx: CanvasRenderingContext2D, at: Tile, color: string) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(at.x - 1, at.y - 18, 2, 18);
  ctx.fillStyle = color;
  quad(ctx, [
    { x: at.x + 1, y: at.y - 18 },
    { x: at.x + 13, y: at.y - 14 },
    { x: at.x + 1, y: at.y - 10 },
  ]);
  ctx.fill();
}

/** What draws each stall shape's body, from its walls to its front. */
export const STALL_BODIES: Record<
  StallShape,
  (ctx: CanvasRenderingContext2D, parts: StallParts) => void
> = {
  stall: drawMarketStall,
  shed: drawShed,
  tent: drawTentStall,
  cabin: drawCabinStall,
  kiosk: drawKiosk,
  igloo: drawIgloo,
  gazebo: drawGazebo,
  chalet: drawChalet,
  treehouse: drawTreehouse,
  windmill: drawWindmill,
  lighthouse: drawLighthouse,
  'food-truck': drawFoodTruck,
  carousel: drawCarouselStall,
  turret: drawTurret,
  barn: drawBarn,
  pagoda: drawPagoda,
};
