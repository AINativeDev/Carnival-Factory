/**
 * The Year in Review's signs on its walls (ADR 0047): the neon artwork that
 * reads '26 → '27 on a dark board on the modern wing's white wall, glowing softly and never
 * flashing, and the sign over each half of the room: LOOKING BACK ON '26 on a
 * carved board in the old masters' wing, LOOKING AHEAD TO '27 in plain black
 * letters on white in the modern one.
 */
import { glow } from './brushes';
import { band, faceText, onFace } from './faces';
import { whiteWall } from './gallery-art';
import { wallFace } from './room';
import { signFont, theme } from './theme';
import type { Thing } from './world';

const { colors } = theme;

/** How brightly the neon glows at `time`: always lit, swelling and easing over several seconds. */
export const neonAt = (time: number, seed: number) =>
  0.85 + 0.15 * Math.sin(time / 2200 + seed * 7);

/** The neon artwork: '26 → '27 in glowing tubes on a dark board, on a white wall. */
export function drawNeonArt(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const face = wallFace(thing);
  whiteWall(ctx, face);
  ctx.fillStyle = colors.ink;
  band(ctx, face, 0.08, 0.92, 54, 100);
  ctx.fill();
  const bright = neonAt(time, thing.seed);
  for (const along of [0.3, 0.7]) {
    const at = onFace(face, along, 77);
    glow(ctx, at.x, at.y, 36, bright);
  }
  const width = Math.abs(face.b.x - face.a.x) * 0.76;
  ctx.globalAlpha = bright;
  faceText(ctx, face, "'26 → '27", 0.5, 77, width, signFont('rounded', 17), colors.mint);
  ctx.globalAlpha = 1;
}

/** The sign over one half of the room: looking back in the old wing, ahead in the modern one. */
export function drawWallSign(ctx: CanvasRenderingContext2D, thing: Thing) {
  const face = wallFace(thing);
  const width = Math.abs(face.b.x - face.a.x) * 0.84;
  if (thing.seed < 0.5) {
    ctx.fillStyle = colors.gold;
    band(ctx, face, 0.04, 0.96, 62, 104);
    ctx.fill();
    ctx.fillStyle = colors.cocoa;
    band(ctx, face, 0.07, 0.93, 65, 101);
    ctx.fill();
    faceText(ctx, face, 'LOOKING BACK', 0.5, 90, width, signFont('serif', 11), colors.gold);
    faceText(ctx, face, "ON '26", 0.5, 74, width, signFont('serif', 18), colors.gold);
    return;
  }
  whiteWall(ctx, face);
  faceText(ctx, face, 'LOOKING AHEAD', 0.5, 90, width, signFont('condensed', 14), colors.ink);
  faceText(ctx, face, "TO '27", 0.5, 72, width, signFont('condensed', 20), colors.berry);
  ctx.fillStyle = colors.ink;
  band(ctx, face, 0.2, 0.8, 60, 62);
  ctx.fill();
}
