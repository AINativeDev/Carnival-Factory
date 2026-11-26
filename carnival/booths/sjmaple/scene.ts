import { theme } from '../../../src/northpole/theme';
import { font, GRID, PLACES, type Spot } from './board';
import { hammer } from './workshop';

const { colors } = theme;

/** The dusk sky in chunky bands, stepped hills, the snow ground and a few slow stars, all behind the workshop. */
export function backdrop(spot: Spot, time: number) {
  const bands = [colors.dusk, colors.dusk, colors.duskLow, colors.horizon];
  for (const [i, color] of bands.entries()) spot(color, 0, i * 8, GRID, 8);
  spot(colors.horizon, 0, 32, GRID, 8);
  for (let x = 0; x < GRID; x++) {
    const hill = 26 + Math.round(4 * Math.sin(x / 5) + 3 * Math.sin(x / 2.3));
    spot(colors.mountain, x, hill, 1, 36 - hill);
    spot(colors.snowShade, x, hill, 1, 1);
  }
  // Snow ground, warmest at the back left.
  spot(colors.snow, 0, 36, GRID, 28);
  spot(colors.snowLit, 0, 36, 32, 4);
  spot(colors.snowShade, 0, 60, GRID, 4);

  // A few slow stars.
  for (const [sx, sy, phase] of [
    [31, 3, 0],
    [33, 14, 2],
    [29, 9, 4],
    [62, 14, 1],
  ] as const) {
    if (Math.sin(time / 1_200 + phase) > -0.3) spot(colors.glow, sx, sy);
  }
}

/** The workbench where tops are built, with its lamp, and the test mat where they spin. */
export function benchAndMat(spot: Spot) {
  const { bench, mat } = PLACES;
  spot(colors.wood, bench.x - 12, bench.y, 24, 3);
  spot(colors.gingerbread, bench.x - 12, bench.y, 24, 1);
  spot(colors.cocoa, bench.x - 11, bench.y + 3, 2, 13);
  spot(colors.cocoa, bench.x + 9, bench.y + 3, 2, 13);
  spot(colors.slabShade, bench.x - 10, bench.y + 16, 22, 2);
  // Its lamp, with a small warm pool.
  spot(colors.lantern, bench.x - 10, bench.y - 6, 2, 2);
  spot(colors.cocoa, bench.x - 10, bench.y - 4, 1, 4);
  spot(colors.glow, bench.x - 12, bench.y - 1, 6, 1);

  // The test mat, with its target rings.
  spot(colors.pineDark, mat.x - 11, mat.y, 22, 4);
  spot(colors.pine, mat.x - 11, mat.y, 22, 2);
  spot(colors.gold, mat.x - 8, mat.y + 1, 2, 1);
  spot(colors.gold, mat.x + 6, mat.y + 1, 2, 1);
  spot(colors.shadow, mat.x - 9, mat.y + 4, 20, 1);
}

/**
 * The elf between the bench and the mat: a hat, a face, a green coat and an
 * arm that hammers while `building`, holding still otherwise.
 */
export function elf(spot: Spot, time: number, building: boolean) {
  const ex = 29;
  const ey = PLACES.bench.y - 12;
  spot(colors.berry, ex - 1, ey - 5, 4, 2);
  spot(colors.berry, ex, ey - 7, 2, 2);
  spot(colors.snow, ex + 1, ey - 8, 2, 1);
  spot(colors.cream, ex - 1, ey - 3, 4, 3);
  spot(colors.ink, ex, ey - 2, 1, 1);
  spot(colors.pine, ex - 2, ey, 6, 7);
  spot(colors.pineDark, ex - 2, ey + 6, 6, 1);
  spot(colors.gold, ex - 2, ey + 3, 6, 1);
  const arm = building ? hammer(time) : 0.3;
  spot(colors.pine, ex - 5, ey + 1 + Math.round(arm * 3), 3, 2);
  spot(colors.cream, ex - 6, ey + 2 + Math.round(arm * 3), 1, 2);
  if (building) spot(colors.gold, ex - 7, ey + 4 + Math.round(arm * 3), 2, 1);
  spot(colors.mountain, ex - 1, ey + 7, 2, 4);
  spot(colors.mountain, ex + 2, ey + 7, 2, 4);
}

/** The TOP SHOP sign over the spin button, drawn last so nothing covers it. */
export function sign(ctx: CanvasRenderingContext2D, spot: Spot, size: number) {
  spot(colors.cocoa, 38, 3, 1, 5);
  spot(colors.cocoa, 60, 3, 1, 5);
  spot(colors.wood, 36, 1, 26, 8);
  spot(colors.cream, 37, 2, 24, 6);
  ctx.fillStyle = colors.ink;
  ctx.font = font(size, 4.5);
  ctx.textAlign = 'center';
  ctx.fillText('TOP SHOP', (size * 49) / GRID, (size * 5) / GRID, (size * 22) / GRID);
}
