import { theme } from '../../../src/northpole/theme';
import { font, GRID, PLACES, type Plot } from './board';
import { hammer } from './workshop';

const { colors } = theme;

/** The dusk sky in chunky bands, stepped hills, the snow ground and a few slow stars, all behind the workshop. */
export function backdrop(plot: Plot, time: number) {
  const bands = [colors.dusk, colors.dusk, colors.duskLow, colors.horizon];
  for (const [i, color] of bands.entries()) plot(color, 0, i * 8, GRID, 8);
  plot(colors.horizon, 0, 32, GRID, 8);
  for (let x = 0; x < GRID; x++) {
    const hill = 26 + Math.round(4 * Math.sin(x / 5) + 3 * Math.sin(x / 2.3));
    plot(colors.mountain, x, hill, 1, 36 - hill);
    plot(colors.snowShade, x, hill, 1, 1);
  }
  // Snow ground, warmest at the back left.
  plot(colors.snow, 0, 36, GRID, 28);
  plot(colors.snowLit, 0, 36, 32, 4);
  plot(colors.snowShade, 0, 60, GRID, 4);

  // A few slow stars.
  for (const [sx, sy, phase] of [
    [31, 3, 0],
    [33, 14, 2],
    [29, 9, 4],
    [62, 14, 1],
  ] as const) {
    if (Math.sin(time / 1_200 + phase) > -0.3) plot(colors.glow, sx, sy);
  }
}

/** The workbench where tops are built, with its lamp, and the test mat where they spin. */
export function benchAndMat(plot: Plot) {
  const { bench, mat } = PLACES;
  plot(colors.wood, bench.x - 12, bench.y, 24, 3);
  plot(colors.gingerbread, bench.x - 12, bench.y, 24, 1);
  plot(colors.cocoa, bench.x - 11, bench.y + 3, 2, 13);
  plot(colors.cocoa, bench.x + 9, bench.y + 3, 2, 13);
  plot(colors.slabShade, bench.x - 10, bench.y + 16, 22, 2);
  // Its lamp, with a small warm pool.
  plot(colors.lantern, bench.x - 10, bench.y - 6, 2, 2);
  plot(colors.cocoa, bench.x - 10, bench.y - 4, 1, 4);
  plot(colors.glow, bench.x - 12, bench.y - 1, 6, 1);

  // The test mat, with its target rings.
  plot(colors.pineDark, mat.x - 11, mat.y, 22, 4);
  plot(colors.pine, mat.x - 11, mat.y, 22, 2);
  plot(colors.gold, mat.x - 8, mat.y + 1, 2, 1);
  plot(colors.gold, mat.x + 6, mat.y + 1, 2, 1);
  plot(colors.shadow, mat.x - 9, mat.y + 4, 20, 1);
}

/**
 * The elf between the bench and the mat: a hat, a face, a green coat and an
 * arm that hammers while `building`, holding still otherwise.
 */
export function elf(plot: Plot, time: number, building: boolean) {
  const ex = 29;
  const ey = PLACES.bench.y - 12;
  plot(colors.berry, ex - 1, ey - 5, 4, 2);
  plot(colors.berry, ex, ey - 7, 2, 2);
  plot(colors.snow, ex + 1, ey - 8, 2, 1);
  plot(colors.cream, ex - 1, ey - 3, 4, 3);
  plot(colors.ink, ex, ey - 2, 1, 1);
  plot(colors.pine, ex - 2, ey, 6, 7);
  plot(colors.pineDark, ex - 2, ey + 6, 6, 1);
  plot(colors.gold, ex - 2, ey + 3, 6, 1);
  const arm = building ? hammer(time) : 0.3;
  plot(colors.pine, ex - 5, ey + 1 + Math.round(arm * 3), 3, 2);
  plot(colors.cream, ex - 6, ey + 2 + Math.round(arm * 3), 1, 2);
  if (building) plot(colors.gold, ex - 7, ey + 4 + Math.round(arm * 3), 2, 1);
  plot(colors.mountain, ex - 1, ey + 7, 2, 4);
  plot(colors.mountain, ex + 2, ey + 7, 2, 4);
}

/** The TOP SHOP sign over the spin button, drawn last so nothing covers it. */
export function sign(ctx: CanvasRenderingContext2D, plot: Plot, size: number) {
  plot(colors.cocoa, 38, 3, 1, 5);
  plot(colors.cocoa, 60, 3, 1, 5);
  plot(colors.wood, 36, 1, 26, 8);
  plot(colors.cream, 37, 2, 24, 6);
  ctx.fillStyle = colors.ink;
  ctx.font = font(size, 4.5);
  ctx.textAlign = 'center';
  ctx.fillText('TOP SHOP', (size * 49) / GRID, (size * 5) / GRID, (size * 22) / GRID);
}
