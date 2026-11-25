/**
 * What brings the Gift Shop's building to life on the map: warm lights along
 * its awning, two elves at the door, one bringing a present and one waving
 * folk in, and a handcart of parcels on the other side. Every motion is slow:
 * the elves sway over seconds and the lights only dip now and then, never
 * flashing (docs/style.md).
 */
import { bulb, twinkle } from './brushes';
import { elf, outfit, swing } from './elf';
import { onFace, type Face } from './faces';
import { present, spot } from './landmark-kit';
import { inTurn } from './rounds';
import { theme } from './theme';
import type { Plot, Tile } from './world';

const { colors } = theme;

/** The elves stand smaller than the map's walkers, so they don't hide the window. */
const ELF = 0.6;

/** Warm bulbs along the awning's edge, which hangs `lift` up and `reach` out from the wall. */
export function awningLights(
  ctx: CanvasRenderingContext2D,
  face: Face,
  lift: number,
  reach: number,
  time: number,
) {
  const count = 9;
  for (let n = 0; n < count; n++) {
    const at = onFace(face, 0.06 + (0.88 * n) / (count - 1), lift - 3, reach);
    bulb(ctx, at.x, at.y, inTurn([colors.lantern, colors.berry, colors.gold], n), twinkle(time, n));
  }
}

/** An elf with its feet at `at`, scaled to the shop, in `seed`'s coat, its hands at `hands`. Gives where they are. */
function smallElf(
  ctx: CanvasRenderingContext2D,
  at: Tile,
  seed: number,
  hands: { left: Tile; right: Tile },
) {
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(ELF, ELF);
  const held = elf(ctx, 0, 0, { ...outfit(seed), ...hands });
  ctx.restore();
  return held;
}

/** The two elves at the door: one carrying a present in, the other waving with a slow swing. */
export function doorElves(ctx: CanvasRenderingContext2D, plot: Plot, time: number) {
  const carrier = spot(plot, 0.18, 0.02, 10);
  const bob = 1.5 * swing(time, 2400, 0.2);
  const { left, right } = smallElf(ctx, { x: carrier.x, y: carrier.y - bob }, 0.1, {
    left: { x: 4, y: 0 },
    right: { x: -4, y: 0 },
  });
  // The present sits in its arms, just under its hands.
  const held = {
    x: carrier.x + ((left.x + right.x) / 2) * ELF,
    y: carrier.y - bob + left.y * ELF + 4,
  };
  present(ctx, held, 10, colors.violet, colors.gold);
  const greeter = spot(plot, 0.3, 0.02, 10);
  const wave = swing(time, 1800, 0.6);
  smallElf(ctx, greeter, 0.6, {
    left: { x: -3, y: 8 },
    right: { x: 6 + 2 * wave, y: -10 - 4 * wave },
  });
}

/** A wooden handcart of parcels on two wheels at `along` the front, ready for the next delivery. */
export function giftCart(ctx: CanvasRenderingContext2D, plot: Plot, along: number) {
  const at = spot(plot, along, 0.03, 10);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(at.x - 14, at.y - 12, 28, 3);
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(at.x + 14, at.y - 11);
  ctx.lineTo(at.x + 22, at.y - 18);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(at.x - 13, at.y - 20, 26, 8);
  for (const dx of [-8, 8]) {
    ctx.fillStyle = colors.night;
    ctx.beginPath();
    ctx.arc(at.x + dx, at.y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.arc(at.x + dx, at.y - 4, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  present(ctx, { x: at.x - 5, y: at.y - 19 }, 10, colors.berry, colors.snow);
  present(ctx, { x: at.x + 5, y: at.y - 18 }, 9, colors.mint, colors.berry);
  present(ctx, { x: at.x, y: at.y - 26 }, 7, colors.gold, colors.pine);
}
