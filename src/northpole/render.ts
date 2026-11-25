/**
 * Drawing the isometric North Pole: what the map draws for each thing standing
 * on the ground and for each plot, handed to the file that draws it. Everything
 * is drawn in world pixels, with the town square's centre at (0, 0), and the
 * map moves the camera. The drawings themselves live in small files by what
 * they are (docs/adr/0019-small-files.md), so this file only chooses.
 */
import { drawBillboard } from './billboard';
import { middle } from './brushes';
import { drawArch, drawBanner, drawBunting } from './entrance';
import { drawCabin, drawStable } from './houses';
import { drawTent, drawWheel } from './midway';
import type { Owner } from './name-board';
import { drawOpenPlot } from './open-plot';
import { drawAttraction } from './pavilion';
import { drawTownTree, drawTree } from './pines';
import { drawShow, type ShowKind } from './show';
import type { NorthPoleSquare } from './square';
import type { PaintSquare } from './faces';
import { drawStall } from './stall';
import { drawBench, drawCart, drawDrift, drawFence, drawLamp, drawSleigh } from './street-things';
import { theme } from './theme';
import { drawTower } from './tower';
import type { Box, Plot, Thing, ThingKind } from './world';

const { colors } = theme;

/** How each kind of scenery is drawn; anything else is a level's performer, ride or dressing. */
const SCENERY: Record<
  Exclude<ThingKind, ShowKind>,
  (ctx: CanvasRenderingContext2D, thing: Thing, time: number) => void
> = {
  tree: drawTree,
  'town-tree': drawTownTree,
  lamp: drawLamp,
  fence: drawFence,
  cabin: drawCabin,
  stable: drawStable,
  sleigh: drawSleigh,
  drift: drawDrift,
  wheel: drawWheel,
  tent: drawTent,
  bench: drawBench,
  cart: drawCart,
  arch: drawArch,
  banner: drawBanner,
  bunting: drawBunting,
  billboard: (ctx, thing, time) => {
    drawBillboard(ctx, middle(thing), time);
  },
};

/** Whether a thing is the map's own scenery, rather than a level's performer, ride or dressing. */
const isScenery = (kind: ThingKind): kind is Exclude<ThingKind, ShowKind> =>
  Object.hasOwn(SCENERY, kind);

/** Draws a thing standing on the ground. */
export function drawThing(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { kind } = thing;
  if (isScenery(kind)) SCENERY[kind](ctx, thing, time);
  else drawShow(ctx, kind, thing, time);
}

/**
 * Draws a plot and whatever stands on it. Returns where a click opens it.
 * `near` says the player stands at it, which makes an open plot's sign bounce.
 */
export function drawPlot(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  square: NorthPoleSquare | undefined,
  paint: PaintSquare,
  time: number,
  near = false,
  owner?: Owner,
): Box {
  if (plot.kind === 'open' || !square) return drawOpenPlot(ctx, plot, time, near);
  const attraction = plot.kind === 'attraction';
  const tower = attraction ? square.stall?.tower : undefined;
  if (tower) return drawTower(ctx, plot, square, paint, time, tower);
  // An attraction is a pavilion, unless it chose a stall, as a level's squares do: then it's that stall, signed by nobody.
  if (attraction && !square.stall) return drawAttraction(ctx, plot, square, paint, time);
  const nobody: Owner = { color: colors.gold, you: false, ...(attraction ? { by: '' } : {}) };
  return drawStall(ctx, plot, square, paint, time, owner ?? nobody);
}
