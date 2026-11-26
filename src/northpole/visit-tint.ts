/**
 * The colour of the square someone is inside, for the columns either side of
 * its drawing to take on (style.css, `--visit-tint`), so the page round it
 * blends in. Read from the drawing a few times a second, shrunk to a few
 * pixels and averaged: only three numbers ever leave the square's picture.
 */

/** How often the tint is read again, in milliseconds. */
const EVERY = 400;

/** How many pixels across the drawing is shrunk to before averaging. */
const SIDE = 4;

let sampler: HTMLCanvasElement | undefined;
let lastRead = Number.NEGATIVE_INFINITY;

/** The average colour of RGBA pixels, skipping clear ones, as a CSS colour; undefined when all are clear. */
export function averageColour(pixels: ArrayLike<number>): string | undefined {
  let [r, g, b, count] = [0, 0, 0, 0];
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    r += pixels[i] ?? 0;
    g += pixels[i + 1] ?? 0;
    b += pixels[i + 2] ?? 0;
    count += 1;
  }
  if (!count) return undefined;
  const mean = (sum: number) => String(Math.round(sum / count));
  return `rgb(${mean(r)} ${mean(g)} ${mean(b)})`;
}

/** Sets `frame`'s tint from the square's last picture on `scratch`, `size` across, at most every `EVERY` ms. */
export function tintFrame(
  frame: HTMLElement,
  scratch: HTMLCanvasElement,
  size: number,
  now: number,
) {
  if (now - lastRead < EVERY) return;
  lastRead = now;
  sampler ??= document.createElement('canvas');
  sampler.width = SIDE;
  sampler.height = SIDE;
  const ctx = sampler.getContext('2d', { willReadFrequently: true });
  try {
    ctx?.drawImage(scratch, 0, 0, size, size, 0, 0, SIDE, SIDE);
    const tint = ctx && averageColour(ctx.getImageData(0, 0, SIDE, SIDE).data);
    if (tint) frame.style.setProperty('--visit-tint', tint);
  } catch {
    // A picture that can't be read keeps the last tint, or the night.
  }
}
