import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  luminance,
  MAX_PER_SECOND,
  maxFlashesPerSecond,
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
    const raw = await page.evaluate(async () => {
      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const out: { t: number; rgb: [number, number, number] }[] = [];
      const start = performance.now();
      while (performance.now() - start < 3000) {
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let r = 0;
        let g = 0;
        let b = 0;
        const step = 4 * 16;
        let n = 0;
        for (let i = 0; i < data.length; i += step) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
        out.push({ t: performance.now() - start, rgb: [r / n, g / n, b / n] });
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return out;
    });
    const samples: Sample[] = raw.map(({ t, rgb }) => ({ t, brightness: luminance(...rgb) }));
    expect(samples.length, 'too few frames sampled').toBeGreaterThan(30);
    expect(maxFlashesPerSecond(samples)).toBeLessThanOrEqual(MAX_PER_SECOND);
  });
}
