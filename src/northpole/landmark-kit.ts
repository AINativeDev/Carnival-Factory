/**
 * The landmarks' building kit, laid out from the door: a box or a spot on the
 * spot by how far `along` its front (0 to 1, left to right on screen) and how
 * `deep` back from it (0 to 1), whichever side the door is on. So each landmark
 * describes its shape once and stands right with its door to the left or to
 * the right. Also the small parts several landmarks share: the side face we
 * see beside the front, a gabled roof, a lit window, a wrapped present and a
 * pennant.
 */
import { glow, quad } from './brushes';
import { faceOf, type Face } from './faces';
import { frontOf } from './landmark-parts';
import { spotPoint } from './stall-plan';
import { theme } from './theme';
import type { Box, Spot, Tile } from './world';

const { colors } = theme;

/** A span from one fraction to another. */
export type Span = readonly [number, number];

/**
 * The tile box `along` the front and `deep` back from it. With the door on the
 * left face the front runs along x and depth goes up y; on the right face the
 * front runs up y and depth goes back down x.
 */
export function area(spot: Spot, along: Span, deep: Span): Box {
  const [from, to] = along;
  const [near, far] = deep;
  return frontOf(spot).out.x < 0
    ? {
        x: spot.x + from * spot.w,
        w: (to - from) * spot.w,
        y: spot.y + spot.h * (1 - far),
        h: (far - near) * spot.h,
      }
    : {
        x: spot.x + spot.w * (1 - far),
        w: (far - near) * spot.w,
        y: spot.y + spot.h * (1 - to),
        h: (to - from) * spot.h,
      };
}

/** Where a spot on the spot is on screen, `lift` up. Attraction spots are square, so depth runs `spot.w` tiles back. */
export const onSpot = (spot: Spot, along: number, deep: number, lift = 0): Tile =>
  spotPoint(frontOf(spot), spot.w, { along, depth: deep }, lift);

/** The face of `box` we see beside its front: right of it with the door on the left, left of it otherwise. */
export function sideOf(spot: Spot, box: Box): Face {
  return frontOf(spot, box).out.x < 0
    ? faceOf({ ...box, door: { x: box.x + box.w, y: box.y } })
    : faceOf({ ...box, door: { x: box.x, y: box.y + box.h } });
}

/** Fills the outline through `points` in `color`. */
export function fillShape(ctx: CanvasRenderingContext2D, points: Tile[], color: string) {
  ctx.fillStyle = color;
  quad(ctx, points);
  ctx.fill();
}

/** Shapes in the order a painter lays them: the one highest on screen, the furthest back, first. */
export const backToFront = <T>(shapes: T[], y: (shape: T) => number): T[] =>
  [...shapes].sort((a, b) => y(a) - y(b));

/** How a gabled roof is pitched and coloured. */
interface Gable {
  /** How high its eaves are, and how much higher its ridge. */
  eaves: number;
  rise: number;
  /** The gable end's colour, and the lit and shaded slopes'. */
  end: string;
  slopes?: readonly [string, string];
  /** How far its ridge tips sideways and its front drops, for a crooked house. */
  lean?: number;
  sag?: number;
}

/**
 * A gabled roof over the box `along` by `deep`, its ridge running from front
 * to back, so its gable end faces the door. The left slope catches the dusk
 * light and the right one is in shade, the far one drawn first.
 */
export function gabledRoof(
  ctx: CanvasRenderingContext2D,
  spot: Spot,
  along: Span,
  deep: Span,
  roof: Gable,
) {
  const { eaves, rise, end: gable, lean = 0, sag = 0 } = roof;
  const [lit, shaded] = roof.slopes ?? [colors.surface, colors.night];
  const [from, to] = along;
  const [near, far] = deep;
  const ridge = (from + to) / 2;
  const front = onSpot(spot, ridge + lean, near, eaves + rise - sag);
  const back = onSpot(spot, ridge - lean, far, eaves + rise);
  const slopes = [
    { edge: from, color: lit },
    { edge: to, color: shaded },
  ].map(({ edge, color }) => {
    const eave = [onSpot(spot, edge, near, eaves), onSpot(spot, edge, far, eaves)];
    return { color, eave, points: [...eave, back, front] };
  });
  // The slope whose far eave is higher on screen is the one we see less of.
  for (const slope of backToFront(slopes, (s) =>
    s.eave.reduce((y, p) => Math.min(y, p.y), Infinity),
  )) {
    fillShape(ctx, slope.points, slope.color);
    // Snow along the eaves, thinner at the back.
    ctx.strokeStyle = colors.snow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const p of slope.eave) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  fillShape(ctx, [onSpot(spot, from, near, eaves), front, onSpot(spot, to, near, eaves)], gable);
}

/** A window lit warm from inside, `w` by `h`, breathing a little. */
export function litWindow(
  ctx: CanvasRenderingContext2D,
  at: Tile,
  w: number,
  h: number,
  time: number,
) {
  const breath = 0.85 + 0.15 * Math.sin(time / 1400 + at.x * 0.05);
  glow(ctx, at.x, at.y, w + 6, breath);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(at.x - w / 2 - 1.5, at.y - h / 2 - 1.5, w + 3, h + 3);
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = breath;
  ctx.fillRect(at.x - w / 2, at.y - h / 2, w, h);
  ctx.globalAlpha = 1;
}

/** A wrapped present `s` wide standing at `at`: its lit left side, its shaded right, its top and a ribbon. */
export function present(
  ctx: CanvasRenderingContext2D,
  at: Tile,
  s: number,
  wrap: string,
  ribbon: string,
) {
  const half = s / 2;
  const tall = s * 0.8;
  const left = { x: at.x - half, y: at.y - half / 2 };
  const right = { x: at.x + half, y: at.y - half / 2 };
  const back = { x: at.x, y: at.y - half };
  const up = (p: Tile) => ({ x: p.x, y: p.y - tall });
  fillShape(ctx, [left, at, up(at), up(left)], wrap);
  fillShape(ctx, [at, right, up(right), up(at)], wrap);
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.25;
  quad(ctx, [at, right, up(right), up(at)]);
  ctx.fill();
  ctx.globalAlpha = 1;
  fillShape(ctx, [up(left), up(at), up(right), up(back)], wrap);
  ctx.strokeStyle = ribbon;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo((left.x + at.x) / 2, (left.y + at.y) / 2);
  ctx.lineTo((left.x + at.x) / 2, (left.y + at.y) / 2 - tall);
  ctx.lineTo((back.x + right.x) / 2, (back.y + right.y) / 2 - tall);
  ctx.moveTo((at.x + right.x) / 2, (at.y + right.y) / 2);
  ctx.lineTo((at.x + right.x) / 2, (at.y + right.y) / 2 - tall);
  ctx.lineTo((left.x + back.x) / 2, (left.y + back.y) / 2 - tall);
  ctx.stroke();
  ctx.lineWidth = 1;
}

/** A pennant on a pole from `foot`, `tall` high, waving slowly. */
export function pennant(
  ctx: CanvasRenderingContext2D,
  foot: Tile,
  tall: number,
  color: string,
  time: number,
) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x - 1, foot.y - tall, 2, tall);
  const wave = Math.sin(time / 700 + foot.x) * 2;
  fillShape(
    ctx,
    [
      { x: foot.x + 1, y: foot.y - tall },
      { x: foot.x + 16, y: foot.y - tall + 4 + wave },
      { x: foot.x + 1, y: foot.y - tall + 9 },
    ],
    color,
  );
}
