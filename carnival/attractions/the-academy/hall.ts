/**
 * The Academy's workshop hall at dusk, one bay a station, side by side: a
 * plank wall with a wainscot, a window on the snowy night or a hanging lamp
 * throwing a warm pool on the floor, and a plank floor with a long runner
 * the ticket travels along. The camera slides from bay to bay (camera.ts),
 * so the visitor sees the ticket walk on to the next station. Each bay's own
 * furniture is in bays.ts.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { bayDecor, BAY_LIGHTS } from './bays';
import { BAYS } from './camera';
import { scatter } from './kit';

const { colors } = theme;

/** Where the wall meets the floor. */
const FLOOR_LINE = 47;
/** The runner the ticket walks along, top and bottom. */
const RUNNER = { top: 70, bottom: 75 };

/** One bay's stretch of wall: planks, a wainscot and its rail. */
function wall(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(0, 0, 100.5, FLOOR_LINE);
  ctx.strokeStyle = colors.wood;
  ctx.globalAlpha = 0.32;
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  for (let x = 3; x < 100; x += 6.25) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FLOOR_LINE);
  }
  ctx.stroke();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(0, 38, 100.5, FLOOR_LINE - 38);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(0, 37.4, 100.5, 0.9);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(0, FLOOR_LINE - 1, 100.5, 1);
  ctx.globalAlpha = 1;
}

/** A window on the snowy dusk outside, `x` to `x + 18` across, with snow on its sill. */
function nightWindow(ctx: CanvasRenderingContext2D, x: number) {
  const top = 26;
  const h = 15;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - 1, top - 1, 20, h + 2);
  const sky = ctx.createLinearGradient(0, top, 0, top + h);
  sky.addColorStop(0, colors.dusk);
  sky.addColorStop(0.7, colors.duskLow);
  sky.addColorStop(1, colors.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(x, top, 18, h);
  ctx.fillStyle = colors.mountain;
  ctx.beginPath();
  ctx.moveTo(x, top + h);
  ctx.lineTo(x + 6, top + h - 5);
  ctx.lineTo(x + 11, top + h - 2.5);
  ctx.lineTo(x + 15, top + h - 6);
  ctx.lineTo(x + 18, top + h - 3);
  ctx.lineTo(x + 18, top + h);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  for (let n = 0; n < 6; n++) {
    ctx.globalAlpha = 0.5 + scatter(n + x) * 0.4;
    ctx.fillRect(x + 1 + scatter(n * 3 + x) * 16, top + 1 + scatter(n * 7 + x) * 7, 0.45, 0.45);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x + 8.6, top, 0.8, h);
  ctx.fillRect(x, top + 7, 18, 0.8);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 1.5, top + h + 0.6, 21, 1.4);
}

/** A lamp hanging over `x` from the ceiling, and the warm pool it throws on the floor. */
function lamp(ctx: CanvasRenderingContext2D, x: number) {
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, 24);
  ctx.stroke();
  glow(ctx, x, 27, 12, 0.9);
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.moveTo(x - 1.6, 24);
  ctx.lineTo(x + 1.6, 24);
  ctx.lineTo(x + 3.4, 27.5);
  ctx.lineTo(x - 3.4, 27.5);
  ctx.fill();
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x + 0.2, 24, 3.2, 3.5);
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x, 27.8, 1.1, 0, Math.PI);
  ctx.fill();
}

/** A warm pool of light on the floor round `x`, lit from a lamp or a window above. */
function pool(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = colors.lantern;
  for (const [rx, a] of [
    [26, 0.08],
    [16, 0.1],
  ] as const) {
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.ellipse(x + 3, 61, rx, rx * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** One bay's floor: warm at the back, cooler at the front, with iso plank seams and the runner. */
function floor(ctx: CanvasRenderingContext2D, bay: number) {
  const boards = ctx.createLinearGradient(0, FLOOR_LINE, 0, 100);
  boards.addColorStop(0, colors.gingerbread);
  boards.addColorStop(0.55, colors.wood);
  boards.addColorStop(1, colors.cocoa);
  ctx.fillStyle = boards;
  ctx.fillRect(0, FLOOR_LINE, 100.5, 100 - FLOOR_LINE);
  ctx.strokeStyle = colors.cocoa;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  for (let x = -100; x < 100; x += 9) {
    ctx.moveTo(x, FLOOR_LINE);
    ctx.lineTo(x + 2 * (100 - FLOOR_LINE), 100);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  // The runner stays quiet, a bright accent kept small (docs/style.md).
  ctx.fillStyle = colors.berry;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, RUNNER.top, 100.5, RUNNER.bottom - RUNNER.top);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = colors.cream;
  ctx.fillRect(0, RUNNER.top + 0.8, 100.5, 0.5);
  ctx.fillRect(0, RUNNER.bottom - 1.3, 100.5, 0.5);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(0, RUNNER.bottom - 0.6, 100.5, 0.6);
  ctx.globalAlpha = 1;
  if (bay === 0) {
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(0, RUNNER.top, 2, RUNNER.bottom - RUNNER.top);
  }
}

/**
 * The hall as the camera sees it, `camera` units along from the first bay's
 * left edge: every bay in view, each with its wall, its light, its floor and
 * its furniture. The hall itself stands still: only the people in it move.
 */
export function hall(ctx: CanvasRenderingContext2D, camera: number) {
  const first = Math.max(0, Math.floor(camera / 100));
  for (let bay = first; bay <= Math.min(BAYS - 1, Math.ceil(camera / 100)); bay++) {
    ctx.save();
    ctx.translate(bay * 100 - camera, 0);
    wall(ctx);
    const light = BAY_LIGHTS.at(bay);
    if (light?.pane !== undefined) nightWindow(ctx, light.pane);
    floor(ctx, bay);
    if (light?.lamp !== undefined) {
      pool(ctx, light.lamp);
      lamp(ctx, light.lamp);
    }
    bayDecor(ctx, bay);
    ctx.restore();
  }
}
