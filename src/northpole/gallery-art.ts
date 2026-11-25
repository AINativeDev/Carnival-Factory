/**
 * The Year in Review's art on its walls (ADR 0047): a framed picture of one
 * of the North Pole's attractions, each in its own style. The old ones hang in
 * heavy gilded frames with a brass plaque on the papered wall; the modern ones
 * in thin black frames on a stretch of white wall, a white cube. A track light
 * over each throws a soft pool on it. The variant picks the picture.
 */
import { glow } from './brushes';
import { band, onFace, type Face } from './faces';
import {
  cocoaStillLife,
  crookedGingerbread,
  oldBigTop,
  staringElf,
  swirlingWheel,
  type Painting,
} from './gallery-paintings-old';
import {
  coasterSplatter,
  popCarousel,
  popStudio,
  rinkColourField,
  schoolGrid,
  towerPoster,
} from './gallery-paintings-modern';
import { WALL, wallFace } from './room';
import { inTurn } from './rounds';
import { theme } from './theme';
import type { Thing } from './world';

const { colors } = theme;

/** How a picture is hung: gilded and old, or thin, black and modern. */
type HangingStyle = 'old' | 'modern';

/** Every picture, in the order a variant from 0 to 1 picks it. */
type Picture = { paint: Painting; style: HangingStyle };
export const PICTURES: readonly [Picture, ...Picture[]] = [
  { paint: swirlingWheel, style: 'old' },
  { paint: oldBigTop, style: 'old' },
  { paint: crookedGingerbread, style: 'old' },
  { paint: cocoaStillLife, style: 'old' },
  { paint: staringElf, style: 'old' },
  { paint: popCarousel, style: 'modern' },
  { paint: popStudio, style: 'modern' },
  { paint: towerPoster, style: 'modern' },
  { paint: rinkColourField, style: 'modern' },
  { paint: schoolGrid, style: 'modern' },
  { paint: coasterSplatter, style: 'modern' },
];

/** Which picture a variant from 0 to 1 hangs. */
export const pictureOf = (seed: number) =>
  Math.min(PICTURES.length - 1, Math.max(0, Math.floor(seed * PICTURES.length)));

/**
 * Paints `paint`'s 100 by 100 canvas onto a face, from `from` to `to` across
 * it and `low` to `high` up it, clipped to that, so it follows the wall.
 */
function onWall(
  ctx: CanvasRenderingContext2D,
  face: Face,
  [from, to, low, high]: readonly [number, number, number, number],
  paint: (ctx: CanvasRenderingContext2D) => void,
) {
  const corner = onFace(face, from, high);
  const right = onFace(face, to, high);
  const foot = onFace(face, from, low);
  ctx.save();
  ctx.transform(
    (right.x - corner.x) / 100,
    (right.y - corner.y) / 100,
    (foot.x - corner.x) / 100,
    (foot.y - corner.y) / 100,
    corner.x,
    corner.y,
  );
  ctx.beginPath();
  ctx.rect(0, 0, 100, 100);
  ctx.clip();
  paint(ctx);
  ctx.restore();
}

/** A stretch of the wall painted white from the skirting to the cornice: the modern wing's white cube. */
export function whiteWall(ctx: CanvasRenderingContext2D, face: Face) {
  ctx.fillStyle = colors.snow;
  band(ctx, face, 0, 1, WALL.skirting, WALL.high - 6);
  ctx.fill();
}

/** A track light under the cornice, its lamp tipped at the art, and its soft pool of light. */
function trackLight(ctx: CanvasRenderingContext2D, face: Face, time: number, seed: number) {
  const pool = onFace(face, 0.5, 74);
  glow(ctx, pool.x, pool.y, 34, 0.75 + 0.1 * Math.sin(time / 2500 + seed * 9));
  ctx.fillStyle = colors.ink;
  band(ctx, face, 0.1, 0.9, WALL.high - 10, WALL.high - 7);
  ctx.fill();
  const lamp = onFace(face, 0.5, WALL.high - 14, 0.15);
  ctx.fillRect(lamp.x - 3, lamp.y - 3, 6, 6);
  ctx.fillStyle = colors.glow;
  ctx.fillRect(lamp.x - 2, lamp.y + 2, 4, 2);
}

/** A framed picture on a back wall: its frame, its painting, a plaque or a white wall, and its light. */
export function drawFramedPicture(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const face = wallFace(thing);
  const { paint, style } = inTurn(PICTURES, pictureOf(thing.seed));
  if (style === 'modern') {
    whiteWall(ctx, face);
    ctx.fillStyle = colors.ink;
    band(ctx, face, 0.17, 0.83, 47, 101);
    ctx.fill();
    onWall(ctx, face, [0.19, 0.81, 49, 99], (ctx) => {
      paint(ctx, time);
    });
  } else {
    // A heavy gilded frame: gold, a dark rebate, a gold bead, and knobs at its corners.
    ctx.fillStyle = colors.gold;
    band(ctx, face, 0.08, 0.92, 40, 106);
    ctx.fill();
    ctx.fillStyle = colors.wood;
    band(ctx, face, 0.14, 0.86, 45, 101);
    ctx.fill();
    ctx.fillStyle = colors.lantern;
    for (const [along, lift] of [
      [0.1, 42],
      [0.9, 42],
      [0.1, 104],
      [0.9, 104],
    ] as const) {
      const knob = onFace(face, along, lift);
      ctx.beginPath();
      ctx.arc(knob.x, knob.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    onWall(ctx, face, [0.18, 0.82, 49, 97], (ctx) => {
      paint(ctx, time);
    });
    // The brass plaque under it.
    ctx.fillStyle = colors.gold;
    band(ctx, face, 0.38, 0.62, 30, 36);
    ctx.fill();
  }
  trackLight(ctx, face, time, thing.seed);
}
