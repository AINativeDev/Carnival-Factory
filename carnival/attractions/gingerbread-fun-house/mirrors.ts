/**
 * The fun-house mirrors: an elf strolls along the snow in front of the house,
 * and as it passes each round mirror window its reflection shows there,
 * stretched tall and thin in the left one and short and wide in the right,
 * wobbling as fun-house mirrors do. Plain functions of `time`.
 */

/** How long the elf takes to stroll across and back, in milliseconds. */
export const STROLL = 16_000;

/** Where the elf walks, along the slab's `gx` from `FROM` to `TO`, in front of the house at `gy` `ALONG`. */
export const PATH = { from: -19, to: 19, along: 19 } as const;

/** The two mirror windows, by where they sit along the front wall's `gx`, and how each one bends. */
export const MIRRORS = [
  { gx: -9, tall: 1.7, wide: 0.6 },
  { gx: 9, tall: 0.6, wide: 1.6 },
] as const;

/** How near along the wall the elf must be for a mirror to catch it. */
export const REACH = 7;

/** Where the elf is at `time`, along `gx`, which way it faces (1 is down the slab) and its stride, from -1 to 1. */
export function strollAt(time: number): { gx: number; facing: 1 | -1; stride: number } {
  const t = (((time % STROLL) + STROLL) % STROLL) / STROLL;
  const out = t < 0.5;
  const along = out ? t * 2 : 2 - t * 2;
  // Ease at each end, so it slows to turn round rather than bouncing.
  const eased = (1 - Math.cos(along * Math.PI)) / 2;
  return {
    gx: PATH.from + (PATH.to - PATH.from) * eased,
    facing: out ? 1 : -1,
    stride: Math.sin(time / 160),
  };
}

/** How the mirror at `gx` shows the elf at `elfGx`: how clearly (0 when out of reach), how far across, and its stretch. */
export function reflection(
  mirror: (typeof MIRRORS)[number],
  elfGx: number,
  time: number,
): { shown: number; across: number; tall: number; wide: number } {
  const off = elfGx - mirror.gx;
  const shown = Math.max(0, 1 - Math.abs(off) / REACH);
  const wobble = Math.sin(time / 500 + mirror.gx) * 0.12;
  return {
    shown,
    across: off * 0.5,
    tall: mirror.tall + wobble,
    wide: mirror.wide - wobble,
  };
}
