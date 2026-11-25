/**
 * The performers, rides, factory dressing and indoor furniture a level may
 * place from its catalogue: the part of a level the map's own scenery doesn't
 * have, drawn by the map like any other thing on the ground (`drawThing` in
 * `render.ts` hands them here). Each one moves only from `time` and its
 * variant, so two jugglers don't throw in step.
 */
import { drawCarousel } from './carousel';
import { drawDesk, drawGlobe } from './classroom';
import { drawPlant, drawRug, drawShelf, drawSofa } from './furniture';
import { drawCable, drawSpotlight } from './studio-gear';
import {
  drawAcousticPanel,
  drawBlackboard,
  drawOnAirLight,
  drawProjectorScreen,
  drawWallDoor,
  drawWallWindow,
} from './wall-things';
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
  // An indoor level's furniture, and what hangs on its walls (ADR 0040).
  plant: drawPlant,
  shelf: drawShelf,
  rug: drawRug,
  sofa: drawSofa,
  desk: drawDesk,
  globe: drawGlobe,
  spotlight: drawSpotlight,
  cable: drawCable,
  'acoustic-panel': drawAcousticPanel,
  'wall-window': drawWallWindow,
  blackboard: drawBlackboard,
  'projector-screen': drawProjectorScreen,
  'on-air-light': drawOnAirLight,
  'wall-door': drawWallDoor,
} as const satisfies Record<string, Draw>;

/** A performer, a ride, a piece of factory dressing or furniture: the things a level adds to the map's scenery. */
export type ShowKind = keyof typeof SHOW;

/** What lies flat on the ground, under everything standing, so it's drawn first and people walk over it. */
export const FLAT: ReadonlySet<string> = new Set(['drift', 'rug', 'cable']);

/** Draws a performer or a ride standing on the snow. */
export function drawShow(
  ctx: CanvasRenderingContext2D,
  kind: ShowKind,
  thing: Thing,
  time: number,
) {
  SHOW[kind](ctx, thing, time);
}
