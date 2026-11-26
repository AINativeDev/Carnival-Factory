/**
 * What the people in the hall are drawn with: the shirts, hair and skin they
 * choose from, and their round heads, hands and arms.
 */
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** The shirts attendees and speakers wear. */
export const SHIRTS = [
  colors.berry,
  colors.pine,
  colors.violet,
  colors.mountain,
  colors.cocoa,
  colors.wood,
  colors.surface,
  colors.gingerbread,
];
/** Attendees' hair, seen from behind. */
export const HAIR = [
  colors.cocoa,
  colors.ink,
  colors.wood,
  colors.night,
  colors.snowShade,
  colors.cocoa,
  colors.wood,
];
/** Hands and faces. */
export const SKIN = [colors.cream, colors.gingerbread, colors.horizon];

/** Colour `n` of `list`, round and round. */
export const pick = (list: readonly string[], n: number) => list.at(n % list.length) ?? colors.ink;

/** A filled circle: a head, a hand, a pom-pom. */
export function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  colour: string,
) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** An arm in the shirt's colour from the shoulder at `from` to the hand at `to`. */
export function arm(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  s: number,
  shirt: string,
  skin: string,
) {
  ctx.strokeStyle = shirt;
  ctx.lineWidth = 1.8 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  dot(ctx, to[0], to[1], 1 * s, skin);
}
