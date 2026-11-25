/**
 * What an indoor level hangs on its back walls (ADR 0040): foam acoustic
 * panels, a window with snow falling past it, a blackboard with chalk on it, a
 * projector screen, the ON AIR light and a pair of doors with a wreath. Each is
 * drawn flat on its wall through `wallFace`, so it follows the wall's slope.
 * Nothing flashes: the ON AIR light swells and fades over seconds.
 */
import { band, faceText, onFace } from './faces';
import { phase } from './elf';
import { WALL, wallFace } from './room';
import { canvasFont, theme } from './theme';
import type { Thing } from './world';

const { colors } = theme;

/** Foam acoustic panels: a dark board of wedges in a three by three grid. */
export function drawAcousticPanel(ctx: CanvasRenderingContext2D, thing: Thing) {
  const face = wallFace(thing);
  ctx.fillStyle = colors.ink;
  band(ctx, face, 0.1, 0.9, 40, 104);
  ctx.fill();
  for (let col = 0; col < 3; col++)
    for (let row = 0; row < 3; row++) {
      const from = 0.14 + col * 0.25;
      ctx.fillStyle = (col + row) % 2 ? colors.surface : colors.shadow;
      band(ctx, face, from, from + 0.22, 44 + row * 20, 60 + row * 20);
      ctx.fill();
    }
}

/** How long a snowflake takes to fall past the window, in milliseconds. */
const FALL = 5000;

/** A window in the wall, the dusk outside and snow falling past it. */
export function drawWallWindow(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const face = wallFace(thing);
  ctx.fillStyle = colors.cream;
  band(ctx, face, 0.12, 0.88, 44, 108);
  ctx.fill();
  ctx.fillStyle = colors.dusk;
  band(ctx, face, 0.18, 0.82, 50, 102);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  for (let n = 0; n < 4; n++) {
    const fall = phase(time, FALL, thing.seed + n / 4);
    const at = onFace(face, 0.25 + n * 0.16, 100 - fall * 48);
    ctx.fillRect(at.x - 1, at.y - 1, 2, 2);
  }
  ctx.fillStyle = colors.cream;
  band(ctx, face, 0.48, 0.52, 50, 102);
  ctx.fill();
  band(ctx, face, 0.18, 0.82, 74, 78);
  ctx.fill();
}

/** A blackboard in a wooden frame, with a title and lines of chalk, and the chalk on its ledge. */
export function drawBlackboard(ctx: CanvasRenderingContext2D, thing: Thing) {
  const face = wallFace(thing);
  ctx.fillStyle = colors.wood;
  band(ctx, face, 0.03, 0.97, 36, 106);
  ctx.fill();
  ctx.fillStyle = colors.pineDark;
  band(ctx, face, 0.05, 0.95, 40, 102);
  ctx.fill();
  faceText(ctx, face, 'SKILL.md', 0.3, 90, 70, canvasFont('small', 'bold'), colors.snow);
  ctx.strokeStyle = colors.snow;
  ctx.globalAlpha = 0.7;
  for (const [n, to] of [0.62, 0.5, 0.7, 0.4].entries()) {
    const from = onFace(face, 0.1, 76 - n * 9);
    const end = onFace(face, to, 76 - n * 9);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // A chalk heart in the corner: the class likes its lessons.
  faceText(ctx, face, '♥', 0.85, 54, 20, canvasFont('body', 'bold'), colors.berry);
  ctx.fillStyle = colors.cocoa;
  band(ctx, face, 0.05, 0.95, 34, 38, 0.06);
  ctx.fill();
}

/** How long the slide on the projector screen takes to build its bars, in milliseconds. */
const SLIDE = 6000;

/** A projector screen pulled down from its case, a chart on it whose bars grow, slide after slide. */
export function drawProjectorScreen(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const face = wallFace(thing);
  ctx.fillStyle = colors.ink;
  band(ctx, face, 0.06, 0.94, 108, 114);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  band(ctx, face, 0.1, 0.9, 46, 108);
  ctx.fill();
  const grown = phase(time, SLIDE, thing.seed);
  const bars = [colors.mint, colors.gold, colors.berry, colors.violet];
  for (const [n, color] of bars.entries()) {
    const from = 0.2 + n * 0.16;
    const tall = Math.min(1, grown * 2) * (14 + n * 9);
    ctx.fillStyle = color;
    band(ctx, face, from, from + 0.1, 54, 54 + tall);
    ctx.fill();
  }
  ctx.fillStyle = colors.ink;
  const cord = onFace(face, 0.5, 46);
  ctx.fillRect(cord.x - 0.5, cord.y, 1, 8);
}

/** How long the ON AIR light takes to swell and fade, in milliseconds: slowly, so it never flashes. */
const ON_AIR = 2400;

/** How bright the ON AIR light is at `time`, from 0.7 to 1. */
export const onAirAt = (time: number, seed: number) =>
  0.85 + 0.15 * Math.sin(phase(time, ON_AIR, seed) * Math.PI * 2);

/** The ON AIR light: a box high on the wall, lit red, its words in white. */
export function drawOnAirLight(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const face = wallFace(thing);
  const bright = onAirAt(time, thing.seed);
  const middle = onFace(face, 0.5, 98);
  ctx.fillStyle = colors.berry;
  for (const r of [30, 20, 12]) {
    ctx.globalAlpha = 0.12 * bright;
    ctx.beginPath();
    ctx.arc(middle.x, middle.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.ink;
  band(ctx, face, 0.08, 0.92, 88, 110);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  ctx.globalAlpha = bright;
  band(ctx, face, 0.12, 0.88, 91, 107);
  ctx.fill();
  ctx.globalAlpha = 1;
  faceText(ctx, face, 'ON AIR', 0.5, 99, 44, canvasFont('small', 'bold'), colors.snow);
}

/** A pair of doors in the wall, panelled, with a wreath on them and the sleigh home outside. */
export function drawWallDoor(ctx: CanvasRenderingContext2D, thing: Thing) {
  const face = wallFace(thing);
  ctx.fillStyle = colors.cream;
  band(ctx, face, 0.12, 0.88, 0, WALL.high - 26);
  ctx.fill();
  for (const [from, to] of [
    [0.16, 0.49],
    [0.51, 0.84],
  ] as const) {
    ctx.fillStyle = colors.cocoa;
    band(ctx, face, from, to, 0, WALL.high - 30);
    ctx.fill();
    ctx.fillStyle = colors.wood;
    band(ctx, face, from + 0.04, to - 0.04, 10, 40);
    ctx.fill();
    band(ctx, face, from + 0.04, to - 0.04, 50, WALL.high - 38);
    ctx.fill();
  }
  ctx.fillStyle = colors.gold;
  for (const along of [0.46, 0.54]) {
    const handle = onFace(face, along, 46);
    ctx.fillRect(handle.x - 1.5, handle.y - 1.5, 3, 3);
  }
  // A wreath across the middle, with a red bow.
  const wreath = onFace(face, 0.5, 70);
  ctx.strokeStyle = colors.pine;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(wreath.x, wreath.y, 10, 11, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.berry;
  ctx.fillRect(wreath.x - 4, wreath.y + 7, 8, 5);
}
