import { theme } from '../../../src/northpole/theme';
import type { Plot } from './board';
import { type Build, type Part, partsOf } from './parts';

const { colors } = theme;

/**
 * A top standing with its tip at (x, y). `parts` says how much is built, 0 to
 * 3 (body, stripes, handle), `angle` is how far it has turned and `lean` how
 * far its handle leans, in pixels.
 */
export function top(
  plot: Plot,
  build: Build,
  x: number,
  y: number,
  parts: number,
  angle: number,
  lean: number,
) {
  const { body, handle, stripe } = partsOf(build);
  const { rows } = body;
  const bodyRows = Math.ceil(Math.min(1, parts) * rows.length);
  for (let r = 0; r < bodyRows; r++) {
    const half = rows[r] ?? 0;
    const shift = Math.round((lean * r) / rows.length);
    for (let dx = -half; dx <= half; dx++) {
      // Stripes wrap round the body, so they slide across as it turns.
      const u = half ? dx / (half + 0.5) : 0;
      const around = Math.asin(Math.max(-1, Math.min(1, u))) + angle;
      const striped = parts > 1 && Math.sin(around * 2) > 0.25 && r > 1 && r < rows.length - 1;
      const painted = striped && (parts >= 2 || dx <= -half + Math.round((parts - 1) * half * 2));
      const base = painted ? stripe.color : dx <= 0 ? colors.gold : colors.gingerbread;
      plot(base, x + dx + shift, y - r);
    }
  }
  if (parts > 2 && bodyRows === rows.length) {
    const stem = Math.max(1, Math.round(Math.min(1, parts - 2) * handle.stem));
    const shift = Math.round(lean);
    const from = y - rows.length;
    for (let s = 0; s < stem; s++) plot(colors.wood, x + shift, from - s);
    if (handle.cap && stem === handle.stem) plot(colors.cocoa, x + shift - 1, from - stem, 3, 1);
  }
}

/**
 * A whole top lying on its side on the ground at `ground`, tip to the left at
 * `x`, handle to the right. Each body row of an upright top becomes a column.
 */
export function lyingTop(plot: Plot, build: Build, x: number, ground: number, angle: number) {
  const { body, handle, stripe } = partsOf(build);
  const { rows } = body;
  const axis = ground - Math.max(...rows);
  for (let c = 0; c < rows.length; c++) {
    const half = rows[c] ?? 0;
    for (let dy = -half; dy <= half; dy++) {
      const u = half ? dy / (half + 0.5) : 0;
      const around = Math.asin(Math.max(-1, Math.min(1, u))) + angle;
      const striped = Math.sin(around * 2) > 0.25 && c > 1 && c < rows.length - 1;
      const base = striped ? stripe.color : dy <= 0 ? colors.gold : colors.gingerbread;
      plot(base, x + c, axis + dy);
    }
  }
  plot(colors.wood, x + rows.length, axis, handle.stem, 1);
  if (handle.cap) plot(colors.cocoa, x + rows.length + handle.stem, axis - 1, 1, 3);
}

/** A small picture of a part for its button, centred on (x, y). */
export function partIcon(plot: Plot, part: Part, build: Build, x: number, y: number) {
  const { body, handle, stripe } = partsOf(build);
  if (part === 'stripe') {
    plot(colors.gold, x - 2, y - 2, 5, 5);
    plot(stripe.color, x - 2, y - 1, 5, 1);
    plot(stripe.color, x - 2, y + 1, 5, 1);
    return;
  }
  if (part === 'body') {
    const { rows } = body;
    for (let i = 0; i < 5; i++) {
      const half = Math.round((rows[Math.floor((i * rows.length) / 5)] ?? 0) / 2);
      plot(i % 2 ? colors.gingerbread : colors.gold, x - half, y + 2 - i, half * 2 + 1, 1);
    }
    return;
  }
  const stem = Math.min(4, handle.stem);
  plot(colors.gold, x - 2, y + 2, 5, 1);
  plot(colors.wood, x, y + 2 - stem, 1, stem);
  if (handle.cap) plot(colors.cocoa, x - 1, y + 1 - stem, 3, 1);
}
