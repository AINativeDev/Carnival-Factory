/**
 * The life round the Gingerbread Fun House on the map, so it's a place people
 * want to walk to (issue #206): elves queueing at its door and one waving the
 * tickets, a candy-cane lamp glowing at dusk, gumdrop string lights along the
 * eaves, a pennant on the crooked ridge and smoke curling from the chimney.
 * All of it moves slowly from `time`: nothing flashes (docs/style.md).
 */
import { bulb, twinkle } from './brushes';
import { elf, outfit, swing } from './elf';
import { onFace, type Face } from './faces';
import { pennant, spot } from './landmark-kit';
import { inTurn } from './rounds';
import { theme } from './theme';
import type { Plot, Tile } from './world';

const { colors } = theme;

const LIGHTS = [colors.berry, colors.mint, colors.gold, colors.violet] as const;

/** How long a puff of chimney smoke takes to rise and fade, in milliseconds. */
export const PUFF = 3_600;

/** Gumdrop-coloured string lights sagging along a face's eaves, `high` up, each shimmering on its own. */
function eavesLights(ctx: CanvasRenderingContext2D, face: Face, high: number, time: number) {
  const count = 9;
  ctx.strokeStyle = colors.cocoa;
  ctx.beginPath();
  for (let n = 0; n < count; n++) {
    const along = (n + 0.5) / count;
    const at = onFace(face, along, high - 3 - Math.sin(along * Math.PI * 4) ** 2 * 3);
    ctx.lineTo(at.x, at.y);
  }
  ctx.stroke();
  for (let n = 0; n < count; n++) {
    const along = (n + 0.5) / count;
    const at = onFace(face, along, high - 3 - Math.sin(along * Math.PI * 4) ** 2 * 3);
    bulb(ctx, at.x, at.y + 2, inTurn(LIGHTS, n), twinkle(time, n));
  }
}

/** Smoke from the chimney top at `top`: three soft puffs rising, swelling and fading, a while apart. */
export function chimneySmoke(ctx: CanvasRenderingContext2D, top: Tile, time: number) {
  ctx.fillStyle = colors.cloud;
  for (let n = 0; n < 3; n++) {
    const age = (((time + (n * PUFF) / 3) % PUFF) + PUFF) % PUFF;
    const t = age / PUFF;
    ctx.globalAlpha = 0.55 * (1 - t);
    ctx.beginPath();
    ctx.arc(
      top.x + Math.sin(t * Math.PI * 2 + n) * 4 + t * 10,
      top.y - t * 34,
      4 + t * 7,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A candy-cane lamp post at `foot`, its lantern glowing warm, breathing a little. */
function candyLamp(ctx: CanvasRenderingContext2D, foot: Tile, time: number) {
  const tall = 44;
  for (let n = 0; n < 6; n++) {
    ctx.fillStyle = inTurn([colors.berry, colors.cream], n);
    ctx.fillRect(foot.x - 1.5, foot.y - ((n + 1) * tall) / 6, 3, tall / 6);
  }
  bulb(ctx, foot.x, foot.y - tall - 3, colors.lantern, 0.85 + 0.15 * Math.sin(time / 1300));
}

/**
 * Elves on the snow before the house: two queueing at the left, shuffling
 * from foot to foot, and one at the right holding up a ticket and waving.
 */
function funHouseElves(ctx: CanvasRenderingContext2D, plot: Plot, time: number) {
  for (const [along, seed] of [
    [0.05, 0.6],
    [0.14, 0.1],
  ] as const) {
    const feet = spot(plot, along, 0.05);
    const shuffle = swing(time, 2_400, seed) * 2 - 1;
    elf(ctx, feet.x, feet.y - Math.abs(shuffle) * 1.5, {
      ...outfit(seed),
      left: { x: -2, y: 12 },
      right: { x: 2, y: 12 },
      stride: shuffle * 0.5,
    });
  }
  const feet = spot(plot, 0.86, 0.05);
  const wave = swing(time, 1_600, 0.3);
  const hands = elf(ctx, feet.x, feet.y, {
    ...outfit(0.9),
    left: { x: -6, y: -8 - wave * 6 },
    right: { x: 3, y: 10 },
  });
  // The ticket it holds up: gold, with a stub torn off.
  ctx.fillStyle = colors.gold;
  ctx.fillRect(hands.left.x - 5, hands.left.y - 9, 10, 6);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(hands.left.x + 2, hands.left.y - 9, 1, 6);
}

/** Everything alive round the house: its lights, its flag, its smoke, its lamp and its elves. */
export function funHouseLife(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  time: number,
  at: { front: Face; eaves: number; peak: Tile; chimney: Tile },
) {
  eavesLights(ctx, at.front, at.eaves, time);
  pennant(ctx, at.peak, 22, colors.berry, time);
  chimneySmoke(ctx, at.chimney, time);
  candyLamp(ctx, spot(plot, 0.97, 0.03), time);
  funHouseElves(ctx, plot, time);
}
