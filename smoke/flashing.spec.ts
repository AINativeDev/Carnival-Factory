import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from './coverage';
import {
  flashingArea,
  luminance,
  MAX_FLASHING_AREA,
  MAX_PER_SECOND,
  type Sample,
} from '../scripts/flashing.ts';
import { attractionShown } from '../src/feature-flag-names';
import { isNorthPoleLevel } from '../src/northpole/north-pole-levels';
import { FLAGS } from './support/feature-flags';

/**
 * Seizure safety: plays every booth and attraction, and every square of a
 * participant's open level, on the back wall of its room and measures how often
 * it flashes (see scripts/flashing.ts). Nothing may flash more than three times
 * a second. A participant's level merges on its own on this check (ADR 0043).
 */
const root = join(import.meta.dirname, '..');
const squares = (['booth', 'attraction'] as const).flatMap((kind) =>
  readdirSync(join(root, 'carnival', `${kind}s`))
    .filter((name) => statSync(join(root, 'carnival', `${kind}s`, name)).isDirectory())
    // An attraction a feature flag holds back isn't on the map to play.
    .filter((id) => kind === 'booth' || attractionShown(id, FLAGS))
    .map((id) => ({ kind, id })),
);

const disabled = JSON.parse(readFileSync(join(root, 'src/northpole/disabled.json'), 'utf8')) as {
  levels?: string[];
};
const closed = new Set((disabled.levels ?? []).map((login) => login.toLowerCase()));
const levels = join(root, 'carnival', 'levels');
const levelSquares = readdirSync(levels)
  .filter((login) => existsSync(join(levels, login, 'level.ts')))
  .filter((login) => !isNorthPoleLevel(login) && !closed.has(login))
  .flatMap((login) =>
    existsSync(join(levels, login, 'squares'))
      ? readdirSync(join(levels, login, 'squares'))
          .filter((id) => existsSync(join(levels, login, 'squares', id, 'square.ts')))
          .map((id) => ({ kind: 'level' as const, id: `${login}/${id}`, scope: `level/${login}` }))
      : [],
  );
const everything = [
  ...squares.map((square) => ({ ...square, scope: `${square.kind}/${square.id}` })),
  ...levelSquares,
];

// On a pull request that only changes one booth or one level, CI plays just
// that booth, or that level's squares, one by one (scripts/smoke-scope.ts).
// The map-wide tests still see every square.
const only = process.env.SMOKE_ONLY;
const played = only ? everything.filter(({ scope }) => scope === only) : everything;

for (const { kind, id } of played) {
  test(`${kind} ${id} doesn't flash more than ${MAX_PER_SECOND} times a second`, async ({
    page,
  }) => {
    // #/level/<login>/<id> puts the player inside that square, like #/booth/<login>.
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
      raw.map(({ t, cells: rgb }) => {
        const [r = 0, g = 0, b = 0] = rgb.at(c) ?? [];
        return { t, brightness: luminance(r, g, b) };
      }),
    );
    expect(
      flashingArea(cells),
      `share of the square flashing over ${MAX_PER_SECOND} a second`,
    ).toBeLessThanOrEqual(MAX_FLASHING_AREA);
  });
}
