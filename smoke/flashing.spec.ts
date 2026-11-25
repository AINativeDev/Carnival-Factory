import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from './coverage';
import {
  flashingArea,
  luminance,
  MAX_FLASHING_AREA,
  MAX_PER_SECOND,
  type Sample,
} from '../scripts/flashing.ts';

/**
 * Seizure safety: plays every booth and attraction on the back wall of its room and measures
 * how often it flashes (see scripts/flashing.ts). Nothing may flash more than
 * three times a second.
 */
const root = join(import.meta.dirname, '..');
const squares = (['booth', 'attraction'] as const).flatMap((kind) =>
  readdirSync(join(root, 'carnival', `${kind}s`))
    .filter((name) => statSync(join(root, 'carnival', `${kind}s`, name)).isDirectory())
    .map((id) => ({ kind, id })),
);

// On a pull request that only changes one booth, CI plays just that booth
// one by one (scripts/smoke-scope.ts). The map-wide tests still see every square.
const only = process.env.SMOKE_ONLY;
const played = only ? squares.filter(({ kind, id }) => `${kind}/${id}` === only) : squares;

for (const { kind, id } of played) {
  test(`${kind} ${id} doesn't flash more than ${MAX_PER_SECOND} times a second`, async ({
    page,
  }) => {
    await page.goto(`#/${kind}/${id}`);
    await expect(page.locator('.map-canvas')).toHaveAttribute('data-stage', /^\d+,\d+,\d+,\d+$/);
    await page.waitForTimeout(1500);
    // An 8 by 8 grid of cells, each with its own brightness over time, so
    // regions flashing out of step can't cancel out.
    const GRID = 8;
    const raw = await page.evaluate(async (grid) => {
      // The square's drawing, on the back wall of the room the player is inside.
      const canvas = document.querySelector<HTMLCanvasElement>('.map-canvas')!;
      const [x, y, w, h] = canvas.dataset.stage!.split(',').map(Number);
      const ctx = canvas.getContext('2d')!;
      const frames: { t: number; cells: [number, number, number][] }[] = [];
      const start = performance.now();
      while (performance.now() - start < 3000) {
        const { data, width, height } = ctx.getImageData(x, y, w, h);
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
