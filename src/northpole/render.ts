/**
 * Drawing the isometric North Pole: what the map draws for each thing standing
 * on the ground and for each spot, handed to the file that draws it. Everything
 * is drawn in world pixels, with the town square's centre at (0, 0), and the
 * map moves the camera. The drawings themselves live in small files by what
 * they are (docs/adr/0019-small-files.md), so this file only chooses.
 */
import { drawBillboard } from './billboard';
import { middle } from './brushes';
import { drawDisplay } from './display';
import { drawArch, drawBanner, drawBunting } from './entrance';
import { drawCabin, drawStable } from './houses';
import { drawTent, drawWheel } from './midway';
import type { Owner } from './name-board';
import { drawOpenSpot } from './open-spot';
import { drawAttraction } from './pavilion';
import { drawTownTree, drawTree } from './pines';
import { drawShow, type ShowKind } from './show';
import type { NorthPoleSquare } from './square';
import type { PaintSquare } from './faces';
import { drawStall } from './stall';
import { LANDMARK_DRAWERS } from './landmarks';
import { drawBench, drawCart, drawDrift, drawFence, drawLamp, drawSleigh } from './street-things';
import { theme } from './theme';
import type { Box, Spot, Thing, ThingKind } from './world';

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
 * Draws a spot and whatever stands on it. Returns where a click opens it.
 * `near` says the player stands at it, which makes an open spot's sign bounce.
 */
export function drawSpot(
  ctx: CanvasRenderingContext2D,
  spot: Spot,
  square: NorthPoleSquare | undefined,
  paint: PaintSquare,
  time: number,
  near = false,
  owner?: Owner,
): Box {
  if (spot.kind === 'open' || !square) return drawOpenSpot(ctx, spot, time, near);
  const attraction = spot.kind === 'attraction';
  // An attraction stands as the landmark it asked for: only attractions keep one (frame-protocol.ts, stallFor).
  const landmark = attraction ? square.stall?.landmark : undefined;
  if (landmark) return LANDMARK_DRAWERS[landmark](ctx, spot, square, paint, time);
  if (attraction && square.stall?.display) return drawDisplay(ctx, spot, square, paint);
  // An attraction with no stall is a pavilion. A level's square stands on an
  // attraction's spot too, but it's a stall like a booth's, signed by nobody.
  const levelSquare = 'kind' in square && square.kind === 'level';
  if (attraction && !square.stall && !levelSquare)
    return drawAttraction(ctx, spot, square, paint, time);
  const nobody: Owner = { color: colors.gold, you: false, ...(attraction ? { by: '' } : {}) };
  return drawStall(ctx, spot, square, paint, time, owner ?? nobody);
}
