import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  flashingArea,
  luminance,
  MAX_FLASHING_AREA,
  MAX_PER_SECOND,
  type Sample,
} from '../scripts/flashing.ts';

/**
 * Seizure safety: plays every booth and attraction on its own page and measures
 * how often it flashes (see scripts/flashing.ts). Nothing may flash more than
 * three times a second.
 */
const root = join(import.meta.dirname, '..');
const squares = (['booth', 'attraction'] as const).flatMap((kind) =>
  readdirSync(join(root, `${kind}s`))
    .filter((name) => statSync(join(root, `${kind}s`, name)).isDirectory())
    .map((id) => ({ kind, id })),
);

for (const { kind, id } of squares) {
  test(`${kind} ${id} doesn't flash more than ${MAX_PER_SECOND} times a second`, async ({
    page,
  }) => {
    await page.goto(`#/${kind}/${id}`);
    await page.waitForTimeout(1500);
    // An 8 by 8 grid of cells, each with its own brightness over time, so
    // regions flashing out of step can't cancel out.
    const GRID = 8;
    const raw = await page.evaluate(async (grid) => {
      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const frames: { t: number; cells: [number, number, number][] }[] = [];
      const start = performance.now();
      while (performance.now() - start < 3000) {
        const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const sums = Array.from({ length: grid * grid }, () => [0, 0, 0, 0]);
        for (let y = 0; y < height; y += 4) {
          for (let x = 0; x < width; x += 4) {
            const i = (y * width + x) * 4;
            const cell =
              sums[Math.floor((y * grid) / height) * grid + Math.floor((x * grid) / width)];
            cell[0] += data[i];
            cell[1] += data[i + 1];
            cell[2] += data[i + 2];
            cell[3]++;
          }
        }
        frames.push({
          t: performance.now() - start,
          cells: sums.map(([r, g, b, n]) => [r / n, g / n, b / n] as [number, number, number]),
        });
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return frames;
    }, GRID);
    expect(raw.length, 'too few frames sampled').toBeGreaterThan(30);
    const cells: Sample[][] = Array.from({ length: GRID * GRID }, (_, c) =>
      raw.map(({ t, cells: rgb }) => ({ t, brightness: luminance(...rgb[c]) })),
    );
    expect(
      flashingArea(cells),
      `share of the square flashing over ${MAX_PER_SECOND} a second`,
    ).toBeLessThanOrEqual(MAX_FLASHING_AREA);
  });
}
