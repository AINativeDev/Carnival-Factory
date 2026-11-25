/**
 * The Factory's landmark on the map: a tall brick tower on the town square
 * with TESSL down its front in golden letters, lit windows up its sides, a
 * gold cog turning on top and smoke from its chimney. It rises above every
 * other attraction, so people find the way into the level that shows how the
 * whole North Pole gets built. Its square's drawing still hangs at its foot,
 * the way every attraction's does, so the smoke and flashing checks see it.
 */
import {
  band,
  block,
  corners,
  bulb,
  faceOf,
  faceSign,
  glow,
  middle,
  onFace,
  PAVILION,
  paintOnFace,
  shadow,
  standing,
  twinkle,
  type Face,
  type PaintSquare,
} from './render';
import type { NorthPoleSquare } from './square';
import { canvasFont, theme } from './theme';
import type { Box, Plot } from './world';

const { colors } = theme;

/** The attraction that is drawn as the tower. */
export const FACTORY_ID = 'the-factory';

/** How tall each part is, in world pixels: the hall at its foot, the tower over it and the cog on top. */
export const TOWER = { hall: 120, tower: 190, cog: 22 };

/** The letters down the tower's front. */
export const LETTERS = ['T', 'E', 'S', 'S', 'L'];

/** How far the cog on top has turned at `time`, in radians: one slow turn every 12 seconds. */
export const cogTurn = (time: number) => ((time / 12_000) % 1) * Math.PI * 2;

/** A box `inset` tiles in from each side of `box`. */
const inset = (box: Box, by: number): Box => ({
  x: box.x + by,
  y: box.y + by,
  w: box.w - by * 2,
  h: box.h - by * 2,
});

/** The cog on top: a gold wheel with eight teeth, turning. */
function cog(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, time: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(cogTurn(time));
  ctx.fillStyle = colors.gold;
  for (let n = 0; n < 8; n++) {
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-r * 0.18, -r * 1.25, r * 0.36, r * 0.5);
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** TESSL down the tower's front, one golden letter above another, each with a warm glow. */
function letters(ctx: CanvasRenderingContext2D, face: Face, from: number, to: number) {
  const step = (to - from) / LETTERS.length;
  ctx.font = canvasFont('title', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  LETTERS.forEach((letter, n) => {
    const at = onFace(face, 0.5, to - step * (n + 0.5), 0.02);
    glow(ctx, at.x, at.y, 22, 0.9);
    ctx.fillStyle = colors.cocoa;
    ctx.fillText(letter, at.x + 1.5, at.y + 1.5);
    ctx.fillStyle = colors.gold;
    ctx.fillText(letter, at.x, at.y);
  });
}

/** A window lit warm from inside, flickering a little. */
function litWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  seed: number,
) {
  const flicker = 0.85 + 0.15 * Math.sin(time / 300 + seed);
  glow(ctx, x, y, 14, flicker);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 5, y - 7, 10, 14);
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = flicker;
  ctx.fillRect(x - 3.5, y - 5.5, 7, 11);
  ctx.globalAlpha = 1;
}

/** Smoke rising from the chimney: five puffs in turn, growing and fading. */
function chimneySmoke(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.fillStyle = colors.snowShade;
  for (let n = 0; n < 5; n++) {
    const age = (time / 1600 + n / 5) % 1;
    ctx.globalAlpha = 0.5 * (1 - age);
    ctx.beginPath();
    ctx.arc(x + age * 14, y - age * 50, 4 + age * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Lit windows in rows up a face, either side of the letters on the front. */
function windows(
  ctx: CanvasRenderingContext2D,
  face: Face,
  low: number,
  high: number,
  time: number,
  across: number[],
) {
  for (let lift = low + 22; lift < high - 10; lift += 38)
    for (const along of across) {
      const at = onFace(face, along, lift);
      litWindow(ctx, at.x, at.y, time, at.x * 0.01 + lift);
    }
}

/** Draws the tower on its plot and returns where a click opens it. */
export function drawFactoryTower(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  square: NorthPoleSquare,
  paint: PaintSquare,
  time: number,
): Box {
  const { x, y } = middle(plot);
  shadow(ctx, x, y + 8, 90);
  block(ctx, plot, PAVILION.stage, colors.snowShade, colors.surface, colors.night);
  // The hall at the foot, with the square's drawing framed in gold and the sign over it.
  const hall = inset(plot, 0.2);
  const front = faceOf({ ...hall, door: plot.door });
  const width = Math.abs(front.b.x - front.a.x);
  block(ctx, hall, TOWER.hall, colors.snow, colors.gingerbread, colors.cocoa, PAVILION.stage);
  const art = width * 0.6;
  ctx.fillStyle = colors.gold;
  band(ctx, front, 0.17, 0.83, PAVILION.art - 4, PAVILION.art + art + 4);
  ctx.fill();
  paintOnFace(paint, square, front, 0.2, 0.8, PAVILION.art);
  faceSign(ctx, front, PAVILION.art + art + 8, TOWER.hall - 4, square.name, '');
  // The tower, rising from the hall's roof.
  const tower = inset(plot, 0.55);
  const rise = PAVILION.stage + TOWER.hall;
  block(ctx, tower, TOWER.tower, colors.snowShade, colors.gingerbread, colors.cocoa, rise);
  const face = faceOf({ ...tower, door: plot.door });
  // The other face we see: right of the front when the door faces left, left of it otherwise.
  const c = corners(tower);
  const side =
    face.a.x === c.left.x && face.a.y === c.left.y
      ? { a: c.bottom, b: c.right, out: face.out }
      : { a: c.left, b: c.bottom, out: face.out };
  windows(ctx, face, rise, rise + TOWER.tower, time, [0.18, 0.82]);
  windows(ctx, side, rise, rise + TOWER.tower, time, [0.3, 0.7]);
  letters(ctx, face, rise + 12, rise + TOWER.tower - 8);
  // Lights round the top, the chimney's smoke and the turning cog.
  const top = rise + TOWER.tower;
  for (let k = 0; k <= 6; k++) {
    const at = onFace(face, k / 6, top - 3);
    bulb(ctx, at.x, at.y, colors.lantern, twinkle(time, at.x + at.y));
  }
  const peak = middle(tower);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(peak.x + 14, peak.y - top - 26, 9, 26);
  chimneySmoke(ctx, peak.x + 18, peak.y - top - 28, time);
  cog(ctx, peak.x - 4, peak.y - top - TOWER.cog, TOWER.cog * 0.7, time);
  return standing(plot, top + TOWER.cog * 2 + 20);
}
