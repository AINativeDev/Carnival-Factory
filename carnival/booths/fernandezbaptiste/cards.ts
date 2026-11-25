/**
 * The cards as they look on the table: face up with their pips, face down
 * with a gold diamond, and stacked in face-down piles whose height shows how
 * many cards each elf has left.
 */
import { box, iso } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { poly } from './brush';
import type { Ctx } from './brush';
import { TOP } from './card-table';
import type { Card } from './deck';

const { colors } = theme;

const SUIT_COLOURS = [colors.berry, colors.pine, colors.violet, colors.gingerbread] as const;
const CARD = { a: 1.6, b: 2.2 };
/** How thick one card is, so stacks and the pile grow as cards land. */
export const THICK = 0.22;

/** Pip spots on a card's face, in halves of its width and length. */
const PIPS: readonly (readonly [number, number][])[] = [
  [],
  [[0, 0]],
  [
    [0, -0.45],
    [0, 0.45],
  ],
  [
    [0.35, -0.5],
    [0, 0],
    [-0.35, 0.5],
  ],
  [
    [-0.4, -0.45],
    [0.4, -0.45],
    [-0.4, 0.45],
    [0.4, 0.45],
  ],
  [
    [-0.4, -0.5],
    [0.4, -0.5],
    [0, 0],
    [-0.4, 0.5],
    [0.4, 0.5],
  ],
];

/**
 * A card lying flat at (gx, gy), `z` up, face up when `card` is given. `fold`
 * squeezes it along its length, 1 flat to 0 edge on, as it turns over.
 */
export function flatCard(ctx: Ctx, gx: number, gy: number, z: number, card: Card | null, fold = 1) {
  const b = CARD.b * fold;
  const at = (u: number, v: number) => iso(gx + u * CARD.a, gy + v * b, z);
  poly(ctx, card ? colors.cream : colors.berry, [at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)]);
  if (!card) {
    poly(ctx, colors.gold, [at(0, -0.55), at(0.5, 0), at(0, 0.55), at(-0.5, 0)]);
    return;
  }
  ctx.fillStyle = SUIT_COLOURS.at(card.suit % SUIT_COLOURS.length) ?? colors.berry;
  for (const [u, v] of PIPS.at(card.rank) ?? []) {
    const p = at(u, v);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 0.55, 0.38 * Math.max(0.2, fold), 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A face-down stack of `count` cards at (gx, gy) on the table. */
export function stack(ctx: Ctx, gx: number, gy: number, count: number) {
  if (count <= 0) return;
  const h = count * THICK;
  box(
    ctx,
    gx - CARD.a,
    gy - CARD.b,
    CARD.a * 2,
    CARD.b * 2,
    h,
    colors.berry,
    colors.cream,
    colors.snowShade,
    TOP,
  );
  flatCard(ctx, gx, gy, TOP + h, null);
}

/** A small jitter for the `n`th card on the pile, so the pile looks tossed rather than stacked. */
export function jitter(n: number) {
  return { gx: Math.sin(n * 2.3) * 0.5, gy: Math.cos(n * 1.7) * 0.5 };
}
