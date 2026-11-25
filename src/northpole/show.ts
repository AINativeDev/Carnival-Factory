/**
 * The performers, rides and factory dressing a level may place from its
 * catalogue: the lively part of a level, drawn by the map like any other thing on the snow
 * (`drawThing` in `render.ts` hands them here). Each one moves only from
 * `time` and its variant, so two jugglers don't throw in step.
 */
import { drawCarousel } from './carousel';
import { drawCoaster, drawCoasterLoop } from './coaster';
import { drawFireBreather, drawJuggler, drawStiltWalker } from './performers';
import { drawBalloon, drawFerrisWheel } from './rides';
import { drawAcrobats, drawBand, drawStrongman } from './troupe';
import { drawCandyPipe, drawCog, drawConveyor, drawLantern } from './workshop';
import type { Thing } from './world';

type Draw = (ctx: CanvasRenderingContext2D, thing: Thing, time: number) => void;

/** How each performer and ride is drawn, by its kind. */
const SHOW = {
  'fire-breather': drawFireBreather,
  juggler: drawJuggler,
  'stilt-walker': drawStiltWalker,
  acrobats: drawAcrobats,
  band: drawBand,
  strongman: drawStrongman,
  'ferris-wheel': drawFerrisWheel,
  carousel: drawCarousel,
  balloon: drawBalloon,
  conveyor: drawConveyor,
  cog: drawCog,
  'candy-pipe': drawCandyPipe,
  lantern: drawLantern,
  coaster: drawCoaster,
  'coaster-loop': drawCoasterLoop,
} as const satisfies Record<string, Draw>;

/** A performer, a ride or a piece of factory dressing: the things a level's show is made of. */
export type ShowKind = keyof typeof SHOW;

/** Draws a performer or a ride standing on the snow. */
export function drawShow(
  ctx: CanvasRenderingContext2D,
  kind: ShowKind,
  thing: Thing,
  time: number,
) {
  SHOW[kind](ctx, thing, time);
}
