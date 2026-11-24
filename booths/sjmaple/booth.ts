import type { NorthPoleSquare } from '../../northpole/square';
import { canvasFont, theme } from '../../northpole/theme';

const { colors } = theme;

/** One whole round, in milliseconds: one top built, tested and put away. */
export const LOOP = 12_000;

/** The square is drawn on a GRID by GRID board of chunky pixels. */
export const GRID = 64;

export type Stage = 'body' | 'stripe' | 'handle' | 'carry' | 'spin' | 'rest';

/** Each stage of the round, from its first moment, in milliseconds. */
const STAGES: readonly [Stage, number][] = [
  ['body', 0],
  ['stripe', 1_500],
  ['handle', 3_000],
  ['carry', 4_500],
  ['spin', 5_500],
  ['rest', 11_000],
];

/** The top spins this long on the test mat, then lies still. */
export const SPIN_TIME = 5_500;

/** How fast a fresh top spins, in radians per second: about one turn a second. */
const SPIN_SPEED = 6;

/** Where things stand on the board, in pixels. */
export const PLACES = {
  bench: { x: 17, y: 41 },
  mat: { x: 47, y: 47 },
} as const;

/** 0 to 1, slow at both ends. */
export function ease(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/** Wraps `value` into [0, `span`), negative values included. */
function wrap(value: number, span: number) {
  return ((value % span) + span) % span;
}

export interface Moment {
  stage: Stage;
  /** How far through its stage, 0 to 1. */
  progress: number;
}

/** Where the round stands at `time`. Repeats every `LOOP`, and before the page loaded too. */
export function momentAt(time: number): Moment {
  const t = wrap(time, LOOP);
  let index = 0;
  STAGES.forEach(([, from], i) => {
    if (t >= from) index = i;
  });
  const [stage, from] = STAGES[index];
  const to = index + 1 < STAGES.length ? STAGES[index + 1][1] : LOOP;
  return { stage, progress: (t - from) / (to - from) };
}

/** How many of the top's three parts are built, 0 to 3, in between while one is going on. */
export function builtParts(moment: Moment): number {
  switch (moment.stage) {
    case 'body':
      return moment.progress;
    case 'stripe':
      return 1 + moment.progress;
    case 'handle':
      return 2 + moment.progress;
    default:
      return 3;
  }
}

/** The angle the spinning top has turned through `ms` after it was set down. */
export function spinAngle(ms: number): number {
  const s = Math.min(1, Math.max(0, ms / SPIN_TIME));
  // The speed falls off smoothly to nothing: (1 - s)^2, integrated.
  return ((SPIN_SPEED * SPIN_TIME) / 1000 / 3) * (1 - (1 - s) ** 3);
}

/** How fast the top turns `ms` after it was set down, 0 to 1 of its first speed. */
export function spinSpeed(ms: number): number {
  const s = Math.min(1, Math.max(0, ms / SPIN_TIME));
  return (1 - s) ** 2;
}

/** How far the top leans, in pixels at its handle: nothing while fast, more as it slows. */
export function wobble(ms: number): number {
  const s = Math.min(1, Math.max(0, ms / SPIN_TIME));
  return Math.sin(ms / 140) * 3.5 * s ** 3;
}

/** Half the top's width at each row, tip first. */
export const BODY_ROWS: readonly number[] = [0, 1, 2, 3, 4, 4, 4, 3, 2];

/** The elf's hammering arm, 0 (up) to 1 (down), while a part is being made. */
export function hammer(time: number): number {
  return (Math.sin(time / 110) + 1) / 2;
}

/** The pixel grid every shape snaps to. */
function pixels(ctx: CanvasRenderingContext2D, size: number) {
  const px = size / GRID;
  return (color: string, x: number, y: number, w = 1, h = 1) => {
    ctx.fillStyle = color;
    const x0 = Math.round(x * px);
    const y0 = Math.round(y * px);
    ctx.fillRect(x0, y0, Math.round((x + w) * px) - x0, Math.round((y + h) * px) - y0);
  };
}

type Plot = ReturnType<typeof pixels>;

const STRIPES = [colors.berry, colors.gold, colors.violet] as const;

/**
 * A top standing with its tip at (x, y). `parts` says how much is built (see
 * `builtParts`), `angle` is how far it has turned and `lean` how far its handle
 * leans, in pixels.
 */
function top(
  plot: Plot,
  x: number,
  y: number,
  parts: number,
  angle: number,
  lean: number,
  color: string,
) {
  const rows = BODY_ROWS.length;
  const bodyRows = Math.ceil(Math.min(1, parts) * rows);
  for (let r = 0; r < bodyRows; r++) {
    const half = BODY_ROWS[r];
    const shift = Math.round((lean * r) / rows);
    for (let dx = -half; dx <= half; dx++) {
      // Stripes wrap round the body, so they slide across as it turns.
      const u = half ? dx / (half + 0.5) : 0;
      const around = Math.asin(Math.max(-1, Math.min(1, u))) + angle;
      const striped = parts > 1 && Math.sin(around * 2) > 0.25 && r > 1 && r < rows - 1;
      const painted = striped && (parts >= 2 || dx <= -half + Math.round((parts - 1) * half * 2));
      const base = painted ? color : dx <= 0 ? colors.gold : colors.gingerbread;
      plot(base, x + dx + shift, y - r);
    }
  }
  if (parts > 2 && bodyRows === rows) {
    const stem = Math.max(1, Math.round(Math.min(1, parts - 2) * 3));
    const shift = Math.round(lean);
    for (let s = 0; s < stem; s++) plot(colors.wood, x + shift, y - rows - s);
    if (stem === 3) plot(colors.cocoa, x + shift - 1, y - rows - 3, 3, 1);
  }
}

const booth: NorthPoleSquare = {
  id: 'sjmaple',
  name: 'Spinning Top Workshop',
  description:
    'An elf builds a striped spinning top, then tests it on the mat until it wobbles to a stop.',
  draw(ctx, size, time) {
    const plot = pixels(ctx, size);
    const moment = momentAt(time);
    const { stage, progress } = moment;

    // Dusk sky in chunky bands, with stepped hills.
    const bands = [colors.dusk, colors.dusk, colors.duskLow, colors.horizon];
    bands.forEach((color, i) => plot(color, 0, i * 8, GRID, 8));
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
      [6, 3, 0],
      [22, 8, 2],
      [40, 4, 4],
      [57, 10, 1],
      [50, 2, 3],
    ] as const) {
      if (Math.sin(time / 1_200 + phase) > -0.3) plot(colors.glow, sx, sy);
    }

    // The shelf of finished tops at the back.
    plot(colors.cocoa, 5, 24, 30, 1);
    plot(colors.wood, 5, 25, 30, 1);
    plot(colors.cocoa, 8, 26, 1, 5);
    plot(colors.cocoa, 31, 26, 1, 5);
    [colors.berry, colors.violet, colors.mint].forEach((c, i) => {
      top(plot, 11 + i * 8, 24, 3, i * 2.1, 0, c);
    });

    // The workbench.
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

    // The elf at the bench: a hat, a face, a green coat and an arm that hammers.
    const ex = bench.x + 8;
    const ey = bench.y - 12;
    plot(colors.berry, ex - 1, ey - 5, 4, 2);
    plot(colors.berry, ex, ey - 7, 2, 2);
    plot(colors.snow, ex + 1, ey - 8, 2, 1);
    plot(colors.cream, ex - 1, ey - 3, 4, 3);
    plot(colors.ink, ex, ey - 2, 1, 1);
    plot(colors.pine, ex - 2, ey, 6, 7);
    plot(colors.pineDark, ex - 2, ey + 6, 6, 1);
    plot(colors.gold, ex - 2, ey + 3, 6, 1);
    const building = stage === 'body' || stage === 'stripe' || stage === 'handle';
    const arm = building ? hammer(time) : 0.3;
    plot(colors.pine, ex - 5, ey + 1 + Math.round(arm * 3), 3, 2);
    plot(colors.cream, ex - 6, ey + 2 + Math.round(arm * 3), 1, 2);
    if (building) plot(colors.gold, ex - 7, ey + 4 + Math.round(arm * 3), 2, 1);
    plot(colors.mountain, ex - 1, ey + 7, 2, 4);
    plot(colors.mountain, ex + 2, ey + 7, 2, 4);

    // The top in progress: on the bench, then carried, then on the mat.
    const color = STRIPES[0];
    const benchTip = { x: bench.x - 2, y: bench.y };
    const matTip = { x: mat.x, y: mat.y };
    if (building) {
      plot(colors.shadow, benchTip.x - 4, benchTip.y, 9, 1);
      top(plot, benchTip.x, benchTip.y, builtParts(moment), 0, 0, color);
      if (hammer(time) > 0.85) plot(colors.glow, benchTip.x + 5, benchTip.y - 5);
    } else if (stage === 'carry') {
      const t = ease(progress);
      const hop = Math.sin(t * Math.PI) * 8;
      plot(colors.shadow, Math.round(benchTip.x + (matTip.x - benchTip.x) * t) - 4, mat.y, 9, 1);
      top(
        plot,
        Math.round(benchTip.x + (matTip.x - benchTip.x) * t),
        Math.round(benchTip.y + (matTip.y - benchTip.y) * t - hop),
        3,
        0,
        0,
        color,
      );
    } else {
      const ms = stage === 'spin' ? progress * SPIN_TIME : SPIN_TIME;
      const angle = spinAngle(ms);
      const lean = stage === 'spin' ? wobble(ms) : 0;
      plot(colors.shadow, matTip.x - 4, matTip.y, 9, 1);
      if (stage === 'spin') {
        // A little spray of snow-dust while it is still fast.
        const fast = spinSpeed(ms);
        if (fast > 0.35) {
          for (let i = 0; i < 4; i++) {
            const a = time / 260 + i * 1.6;
            plot(colors.snowLit, matTip.x + Math.round(Math.cos(a) * 7), matTip.y - 1 - (i % 2), 1);
          }
        }
        top(plot, matTip.x, matTip.y, 3, angle, lean, color);
      } else {
        // Lying still, tipped over on its side, until the next round.
        const settle = ease(progress * 4);
        const fall = Math.round(settle * 3);
        top(plot, matTip.x, matTip.y - fall, 3, angle, 2 + settle * 3, color);
      }
    }

    // The sign.
    plot(colors.cocoa, 38, 3, 1, 5);
    plot(colors.cocoa, 60, 3, 1, 5);
    plot(colors.wood, 36, 1, 26, 8);
    plot(colors.cream, 37, 2, 24, 6);
    ctx.fillStyle = colors.ink;
    ctx.font = canvasFont('small', 'bold').replace(/\d+px/, `${Math.round(size * 0.07)}px`);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TOP SHOP', (size * 49) / GRID, (size * 5) / GRID, (size * 22) / GRID);
  },
};

export default booth;
