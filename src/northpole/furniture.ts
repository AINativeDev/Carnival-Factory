/**
 * An indoor level's furniture on the floor (ADR 0040): a pot plant, a
 * bookshelf, a rug and a sofa. They stand still, as furniture does, in the
 * same light as everything on the map, so they're drawn with `brushes.ts`.
 * The pupils' desks, the globe and the studio's gear are in `classroom.ts`
 * and `studio-gear.ts`.
 */
import { block, corners, diamond, middle, shadow } from './brushes';
import { band, type Face } from './faces';
import { inTurn } from './rounds';
import { theme } from './theme';
import { toScreen, type Box, type Thing } from './world';

const { colors } = theme;

/** A box `by` tiles in from each side of `box`. */
export const inset = (box: Box, by: number): Box => ({
  x: box.x + by,
  y: box.y + by,
  w: box.w - by * 2,
  h: box.h - by * 2,
});

/** A pot plant: a clay pot and a tuft of broad leaves, a little different each time. */
export function drawPlant(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 14);
  block(ctx, inset(thing, 0.32), 16, colors.cocoa, colors.gingerbread, colors.wood);
  const leaves = 5 + Math.round(thing.seed * 3);
  for (let n = 0; n < leaves; n++) {
    const a = -Math.PI / 2 + (n / (leaves - 1) - 0.5) * 2.4;
    ctx.fillStyle = n % 2 ? colors.pine : colors.pineDark;
    ctx.beginPath();
    ctx.ellipse(
      x + Math.cos(a) * 10,
      y - 26 + Math.sin(a) * 10,
      4,
      11,
      a + Math.PI / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/** The book spines' colours, in turn along a shelf. */
const SPINES = [
  colors.berry,
  colors.gold,
  colors.mint,
  colors.violet,
  colors.ice,
  colors.cream,
] as const;

/** A tall bookshelf, its books' spines facing the room on three shelves. */
export function drawShelf(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = middle(thing);
  shadow(ctx, x, y + 4, 40);
  const body = inset(thing, 0.08);
  const high = 78;
  block(ctx, body, high, colors.wood, colors.cocoa, colors.cocoa);
  const c = corners(body);
  const front: Face = { a: c.left, b: c.bottom, out: { x: 0, y: 0 } };
  for (let shelf = 0; shelf < 3; shelf++) {
    const low = 6 + shelf * 24;
    let along = 0.06;
    let n = Math.round(thing.seed * 7) + shelf * 3;
    while (along < 0.9) {
      const wide = 0.05 + 0.03 * ((n * 7) % 3);
      ctx.fillStyle = inTurn(SPINES, n);
      band(ctx, front, along, Math.min(0.94, along + wide), low, low + 16 + ((n * 5) % 4));
      ctx.fill();
      along += wide + 0.01;
      n++;
    }
  }
  // The shelves the books stand on.
  for (let shelf = 0; shelf < 4; shelf++) {
    ctx.fillStyle = colors.wood;
    band(ctx, front, 0, 1, shelf * 24 + 3, shelf * 24 + 6);
    ctx.fill();
  }
}

/** A rug lying on the floor, a gold border round a red field and a star in the middle. */
export function drawRug(ctx: CanvasRenderingContext2D, thing: Thing) {
  const c = corners(inset(thing, 0.12));
  ctx.fillStyle = colors.gold;
  diamond(ctx, c);
  ctx.fill();
  ctx.fillStyle = thing.seed > 0.5 ? colors.pine : colors.berry;
  diamond(ctx, corners(inset(thing, 0.24)));
  ctx.fill();
  const { x, y } = middle(thing);
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  for (let n = 0; n < 10; n++) {
    const r = n % 2 ? 5 : 12;
    const a = (n / 10) * Math.PI * 2;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.5);
  }
  ctx.closePath();
  ctx.fill();
}

/** A sofa two tiles long: a seat, a back and two arms, with a cushion on it. */
export function drawSofa(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = middle(thing);
  shadow(ctx, x, y + 4, 40);
  const cover = thing.seed > 0.5 ? colors.violet : colors.berry;
  const back = { x: thing.x + 0.1, y: thing.y + 0.1, w: thing.w - 0.2, h: 0.25 };
  block(ctx, back, 30, cover, colors.cocoa, colors.cocoa);
  block(ctx, { ...back, y: thing.y + 0.35, h: 0.55 }, 14, cover, cover, colors.cocoa);
  for (const at of [thing.x + 0.1, thing.x + thing.w - 0.3])
    block(ctx, { x: at, y: thing.y + 0.1, w: 0.2, h: 0.8 }, 20, cover, cover, colors.cocoa);
  block(
    ctx,
    { x: thing.x + 0.5, y: thing.y + 0.4, w: 0.35, h: 0.3 },
    8,
    colors.gold,
    colors.gold,
    colors.wood,
    14,
  );
}
