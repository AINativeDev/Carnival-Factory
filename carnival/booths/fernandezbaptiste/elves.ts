/**
 * The two elves at the table: where they stand, how they look, their arms
 * reaching over the cards, and the speech bubble they shout "SNAP!" in. Their
 * arms are drawn apart from their bodies so they can go over the table.
 */
import { shadow } from '../../../src/northpole/diorama';
import type { Point } from '../../../src/northpole/diorama';
import { canvasFont, theme } from '../../../src/northpole/theme';
import { line, poly } from './brush';
import type { Ctx } from './brush';
import { seat } from './deck';
import type { Player } from './deck';

const { colors } = theme;

/** Where each elf stands, beside the table. */
export const ELVES = [
  { gx: -12.5, gy: 7.5 },
  { gx: 7.5, gy: -12.5 },
] as const;
/** Each elf's coat and hat. */
const OUTFITS = [
  { coat: colors.pine, shade: colors.pineDark, hat: colors.berry },
  { coat: colors.berry, shade: colors.cocoa, hat: colors.pine },
] as const;
/** How much bigger the elves are drawn than their outline below, so poses scale with them. */
export const ELF_SIZE = 1.5;

/** How an elf stands at one moment: where its hands are, and how high it hops. */
export interface Pose {
  /** Where each hand is on screen: the one away from the table, then the one that plays. */
  hands: [Point, Point];
  /** How high the elf hops, for a cheer. */
  hop: number;
}

/** An elf standing at (x, y), facing the table: `face` 1 looks right, -1 left. */
export function elf(ctx: Ctx, foot: Point, face: 1 | -1, who: Player, pose: Pose) {
  const outfit = seat(OUTFITS, who);
  shadow(ctx, foot.x, foot.y, 6 * ELF_SIZE);
  ctx.save();
  ctx.translate(foot.x, foot.y - pose.hop);
  ctx.scale(ELF_SIZE, ELF_SIZE);
  const x = 0;
  const y = 0;
  // Legs and boots.
  ctx.fillStyle = colors.ink;
  ctx.fillRect(x - 1.4, y - 3, 1.1, 3);
  ctx.fillRect(x + 0.3, y - 3, 1.1, 3);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 1.6 + face * 0.3, y - 0.8, 1.5, 0.8);
  ctx.fillRect(x + 0.1 + face * 0.3, y - 0.8, 1.5, 0.8);
  // The coat, lit on its left, with a gold belt.
  poly(ctx, outfit.coat, [
    { x: x - 2.6, y: y - 2.6 },
    { x: x + 2.6, y: y - 2.6 },
    { x: x + 1.8, y: y - 8.4 },
    { x: x - 1.8, y: y - 8.4 },
  ]);
  poly(ctx, outfit.shade, [
    { x, y: y - 2.6 },
    { x: x + 2.6, y: y - 2.6 },
    { x: x + 1.8, y: y - 8.4 },
    { x, y: y - 8.4 },
  ]);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 2.3, y - 4.6, 4.6, 0.7);
  // The head, ears and face, looking at the table.
  const head = { x: x + face * 0.3, y: y - 10.2 };
  ctx.fillStyle = colors.cream;
  for (const side of [-1, 1]) {
    poly(ctx, colors.cream, [
      { x: head.x + side * 1.6, y: head.y - 0.4 },
      { x: head.x + side * 3, y: head.y - 1.4 },
      { x: head.x + side * 1.6, y: head.y + 0.6 },
    ]);
  }
  ctx.beginPath();
  ctx.arc(head.x, head.y, 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.arc(head.x + face * 0.8, head.y - 0.2, 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(head.x + face * 1.1, head.y + 0.7, 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // The hat, its tip flopping away from the table, and its snowy pompom.
  poly(ctx, outfit.hat, [
    { x: head.x - 2.1, y: head.y - 1 },
    { x: head.x + 2.1, y: head.y - 1 },
    { x: head.x - face * 2.6, y: head.y - 5.4 },
  ]);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(head.x - 2.2, head.y - 1.6, 4.4, 0.9);
  ctx.beginPath();
  ctx.arc(head.x - face * 2.6, head.y - 5.4, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Which way the table is from elf `who`: 1 to the right, -1 to the left. */
export function towardTable(who: Player): 1 | -1 {
  return who === 0 ? 1 : -1;
}

/** An elf's two arms, drawn over the table, from the shoulders to `pose.hands`. */
export function arms(ctx: Ctx, foot: Point, who: Player, pose: Pose) {
  const outfit = seat(OUTFITS, who);
  const y = foot.y - pose.hop;
  const toward = towardTable(who);
  const shoulder = (side: number): Point => ({
    x: foot.x + side * toward * 1.7 * ELF_SIZE,
    y: y - 7.6 * ELF_SIZE,
  });
  const arm = (from: Point, hand: Point) => {
    line(ctx, outfit.coat, 1.3 * ELF_SIZE, from, hand);
    ctx.fillStyle = colors.cream;
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 0.75 * ELF_SIZE, 0, Math.PI * 2);
    ctx.fill();
  };
  arm(shoulder(-1), pose.hands[0]);
  arm(shoulder(1), pose.hands[1]);
}

/** A speech bubble saying `text` above (x, y). */
export function bubble(ctx: Ctx, x: number, y: number, text: string, alpha: number) {
  ctx.globalAlpha = alpha;
  poly(ctx, colors.cream, [
    { x: x - 1, y: y - 1.5 },
    { x: x + 1.2, y: y - 1.5 },
    { x: x + 0.2, y: y + 0.4 },
  ]);
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.roundRect(x - 6.5, y - 6.5, 13, 5.2, 1.6);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(x, y - 3.85);
  ctx.scale(0.24, 0.24);
  ctx.fillText(text, 0, 0, 11.5 / 0.24);
  ctx.restore();
  ctx.globalAlpha = 1;
}
