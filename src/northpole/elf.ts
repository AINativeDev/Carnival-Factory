/**
 * The elf every level performer is: the same coat, belt, round face and
 * pointed hat as the elves walking the map, but with arms, so it can juggle,
 * lift, drum and wave. Drawn in world pixels with its feet at (x, y).
 */
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** How an elf stands: its coat and hat, and where each hand is from its shoulders. */
export interface Pose {
  coat: string;
  hat: string;
  /** Each hand's offset from its own shoulder, in world pixels; up is negative. */
  left: Tile;
  right: Tile;
  /** How far its legs are apart in mid-stride, from -1 to 1. */
  stride?: number;
}

/** A performer's coat and hat from its variant, so two of a kind needn't match. */
export function outfit(seed: number): { coat: string; hat: string } {
  const coat =
    seed < 0.25
      ? colors.berry
      : seed < 0.5
        ? colors.pine
        : seed < 0.75
          ? colors.violet
          : colors.gingerbread;
  return { coat, hat: coat === colors.pine ? colors.berry : colors.pine };
}

/** How far up an elf's shoulders are from its feet. */
const SHOULDER = 24;

/**
 * Draws an elf with its feet at (x, y), and gives back where its hands are,
 * so the juggler's balls and the strongman's barbell can meet them.
 */
export function elf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pose: Pose,
): { left: Tile; right: Tile } {
  const stride = (pose.stride ?? 0) * 2;
  ctx.fillStyle = colors.night;
  ctx.fillRect(x - 4 + stride, y - 10, 3, 10);
  ctx.fillRect(x + 1 - stride, y - 10, 3, 10);
  ctx.fillStyle = pose.coat;
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 9);
  ctx.lineTo(x + 7, y - 9);
  ctx.lineTo(x + 4, y - 26);
  ctx.lineTo(x - 4, y - 26);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 6, y - 14, 12, 2);
  const left = { x: x - 5 + pose.left.x, y: y - SHOULDER + pose.left.y };
  const right = { x: x + 5 + pose.right.x, y: y - SHOULDER + pose.right.y };
  ctx.strokeStyle = pose.coat;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - SHOULDER);
  ctx.lineTo(left.x, left.y);
  ctx.moveTo(x + 5, y - SHOULDER);
  ctx.lineTo(right.x, right.y);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.glow;
  for (const hand of [left, right]) {
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y - 31, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pose.hat;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 34);
  ctx.lineTo(x + 6, y - 34);
  ctx.lineTo(x + 10, y - 46);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 7, y - 36, 14, 3);
  ctx.beginPath();
  ctx.arc(x + 10, y - 46, 2.5, 0, Math.PI * 2);
  ctx.fill();
  return { left, right };
}

/** A gentle loop from 0 to 1 and back over `period` milliseconds, offset by a variant. */
export function swing(time: number, period: number, seed: number): number {
  return (1 - Math.cos(((time + seed * period) / period) * Math.PI * 2)) / 2;
}

/** How far through a loop of `period` milliseconds it is, from 0 to 1, offset by a variant. */
export function phase(time: number, period: number, seed: number): number {
  const at = (time / period + seed) % 1;
  return at < 0 ? at + 1 : at;
}
