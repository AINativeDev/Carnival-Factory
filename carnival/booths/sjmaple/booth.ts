import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { canvasFont, theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** The square is drawn on a GRID by GRID board of chunky pixels. */
export const GRID = 64;

/** A body to pick: half its width at each row, tip first, how long it spins and how much it wobbles. */
export interface Body {
  name: string;
  rows: readonly number[];
  spin: number;
  wobble: number;
}

export const BODIES: readonly Body[] = [
  { name: 'ROUND', rows: [0, 1, 2, 3, 4, 4, 4, 3, 2], spin: 5_500, wobble: 1 },
  { name: 'WIDE', rows: [0, 1, 3, 4, 5, 6, 6, 5, 3], spin: 7_000, wobble: 0.6 },
  { name: 'TALL', rows: [0, 1, 1, 2, 2, 3, 3, 3, 3, 3, 2], spin: 4_000, wobble: 1.5 },
];

/** A handle to pick: its stem in pixels, whether it has a cap, and what it adds to the spin and the wobble. */
export interface Handle {
  name: string;
  stem: number;
  cap: boolean;
  spin: number;
  wobble: number;
}

export const HANDLES: readonly Handle[] = [
  { name: 'KNOB', stem: 3, cap: true, spin: 500, wobble: 1 },
  { name: 'SHORT', stem: 2, cap: false, spin: 0, wobble: 0.7 },
  { name: 'LONG', stem: 5, cap: false, spin: 1_200, wobble: 1.5 },
];

/** The stripes to pick, by name and colour. */
export const STRIPES: readonly { name: string; color: string }[] = [
  { name: 'BERRY', color: colors.berry },
  { name: 'VIOLET', color: colors.violet },
  { name: 'MINT', color: colors.mint },
  { name: 'ICE', color: colors.ice },
];

/** A top, as an index into each list of parts. */
export interface Build {
  body: number;
  stripe: number;
  handle: number;
}

export type Part = keyof Build;

/** The top hops from the bench to the mat for this long, in milliseconds. */
export const CARRY = 700;
/** Once it stops, it tips over and lies on the mat this long before it goes back on the bench. */
export const REST = 2_500;
/** After this long with nobody pressing, in milliseconds, the elf builds and tests tops on their own again. */
export const IDLE = 30_000;
/** One round of the elf's own building and testing, and when in it the elf sets the top spinning. */
export const DEMO_LOOP = 16_000;
export const DEMO_LAUNCH = 3_000;
/** The elf keeps hammering this long after a part is changed. */
export const HAMMER = 600;

/** Where things stand on the board, in pixels. */
export const PLACES = {
  bench: { x: 17, y: 41 },
  mat: { x: 47, y: 47 },
} as const;

export type Button = Part | 'spin';

/** The buttons, as pixel rectangles on the board: the three parts, then the spin button. */
export const BUTTONS: readonly { name: Button; x: number; y: number; w: number; h: number }[] = [
  { name: 'body', x: 2, y: 2, w: 25, h: 7 },
  { name: 'stripe', x: 2, y: 10, w: 25, h: 7 },
  { name: 'handle', x: 2, y: 18, w: 25, h: 7 },
  { name: 'spin', x: 38, y: 11, w: 22, h: 8 },
];

/** The button at board pixel (x, y), or null. */
export function buttonAt(x: number, y: number): Button | null {
  const hit = BUTTONS.find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
  return hit ? hit.name : null;
}

/** 0 to 1, slow at both ends. */
export function ease(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

/** How a top does on the mat: how long it spins, in milliseconds, and how much it wobbles. */
export interface Test {
  spin: number;
  wobble: number;
}

/**
 * How `build` does when it is set spinning at `launchedAt`. The parts decide
 * most of it, and the moment it is let go adds up to a tenth either way.
 */
export function testOf(build: Build, launchedAt: number): Test {
  const body = BODIES[build.body];
  const handle = HANDLES[build.handle];
  const luck = Math.sin(launchedAt * 12.9898) * 43_758.5453;
  const knack = 0.9 + 0.2 * (luck - Math.floor(luck));
  return {
    spin: Math.round((body.spin + handle.spin) * knack),
    wobble: body.wobble * handle.wobble,
  };
}

/** A word for how much a top wobbled. */
export function rating(wobble: number): string {
  if (wobble < 0.75) return 'STEADY';
  if (wobble < 1.3) return 'WOBBLY';
  return 'WILD';
}

export type Stage = 'carry' | 'spin' | 'rest' | 'done';

/** Where a test stands `ms` after the top was let go, for a top that spins `spin` ms. */
export function stageAt(ms: number, spin: number): { stage: Stage; progress: number } {
  if (ms < CARRY) return { stage: 'carry', progress: clamp01(ms / CARRY) };
  if (ms < CARRY + spin) return { stage: 'spin', progress: (ms - CARRY) / spin };
  if (ms < CARRY + spin + REST) return { stage: 'rest', progress: (ms - CARRY - spin) / REST };
  return { stage: 'done', progress: 1 };
}

/** How fast a fresh top spins, in radians per second: about one turn a second. */
const SPIN_SPEED = 6;

/** The angle a top that spins for `spin` ms has turned through `ms` after it was set down. */
export function spinAngle(ms: number, spin: number): number {
  const s = clamp01(ms / spin);
  // The speed falls off smoothly to nothing: (1 - s)^2, integrated.
  return ((SPIN_SPEED * spin) / 1000 / 3) * (1 - (1 - s) ** 3);
}

/** How fast the top turns `ms` after it was set down, 0 to 1 of its first speed. */
export function spinSpeed(ms: number, spin: number): number {
  return (1 - clamp01(ms / spin)) ** 2;
}

/** How far the top leans, in pixels at its handle: nothing while fast, more as it slows. */
export function wobble(ms: number, test: Test): number {
  const s = clamp01(ms / test.spin);
  return Math.sin(ms / 140) * Math.min(6, 3.5 * test.wobble) * s ** 3;
}

/** Where the top is, tip first, while it is carried from `from` to `to`, `progress` 0 to 1. */
export function carryTip(
  progress: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
): { x: number; y: number } {
  const t = ease(progress);
  const hop = Math.sin(t * Math.PI) * 8;
  return {
    x: Math.round(from.x + (to.x - from.x) * t),
    y: Math.round(from.y + (to.y - from.y) * t - hop),
  };
}

/**
 * How the stopped top lies, `progress` 0 to 1 through its rest: it leans
 * further for a moment, tip still on the mat, then lies on its side.
 */
export function restPose(progress: number): { lying: boolean; lean: number } {
  const settle = ease(progress * 4);
  return settle < 1 ? { lying: false, lean: 2 + settle * 3 } : { lying: true, lean: 0 };
}

/** The elf's hammering arm, 0 (up) to 1 (down), while a part is being made. */
export function hammer(time: number): number {
  return (Math.sin(time / 110) + 1) / 2;
}

/** All the booth remembers of the people playing with it, for one visit. */
export interface Workshop {
  build: Build;
  /** The `time` the top was last let go, or null before the first test. */
  launchedAt: number | null;
  /** The top that was let go then, which later changes to `build` never touch. */
  tested: Build;
  /** The longest spin so far, in milliseconds, counted once each test is done. */
  best: number;
  /** Whether the last test has been counted towards `best`. */
  counted: boolean;
  /** The `time` of the last press, and of the last change to a part. */
  pressedAt: number;
  changedAt: number;
}

export function newWorkshop(): Workshop {
  return {
    build: { body: 0, stripe: 0, handle: 0 },
    launchedAt: null,
    tested: { body: 0, stripe: 0, handle: 0 },
    best: 0,
    counted: true,
    pressedAt: -Infinity,
    changedAt: -Infinity,
  };
}

/** Whether a top is out on the mat at `time`, so the buttons wait. */
export function testing(state: Workshop, time: number): boolean {
  if (state.launchedAt === null) return false;
  const test = testOf(state.tested, state.launchedAt);
  return stageAt(time - state.launchedAt, test.spin).stage !== 'done';
}

/**
 * The workshop after `presses` presses on `button` at `time`. Buttons do
 * nothing while a top is out, and a finished test is counted before anything
 * replaces it.
 */
export function press(state: Workshop, button: Button | null, presses: number, time: number) {
  if (presses < 1) return state;
  const pressed = { ...settle(state, time), pressedAt: time };
  if (!button || testing(state, time)) return pressed;
  if (button === 'spin')
    return { ...pressed, launchedAt: time, tested: state.build, counted: false };
  const { body, stripe, handle } = state.build;
  const build =
    button === 'body'
      ? { body: (body + presses) % BODIES.length, stripe, handle }
      : button === 'stripe'
        ? { body, stripe: (stripe + presses) % STRIPES.length, handle }
        : { body, stripe, handle: (handle + presses) % HANDLES.length };
  return { ...pressed, build, changedAt: time };
}

/** The workshop with its last test counted towards the best once it is done. */
export function settle(state: Workshop, time: number): Workshop {
  if (state.counted || state.launchedAt === null || testing(state, time)) return state;
  const { spin } = testOf(state.tested, state.launchedAt);
  return { ...state, best: Math.max(state.best, spin), counted: true };
}

/** Whether nobody has played for a while, so the elf runs the workshop on their own. */
export function idle(state: Workshop, time: number): boolean {
  return time - state.pressedAt > IDLE && !testing(state, time);
}

/** The elf's own round at `time`: which top they build, when they let it go, and how far it is built. */
export function demoAt(time: number): { build: Build; launchedAt: number; built: number } {
  const n = Math.floor(time / DEMO_LOOP);
  const start = n * DEMO_LOOP;
  return {
    build: {
      body: n % BODIES.length,
      stripe: n % STRIPES.length,
      handle: (n + 1) % HANDLES.length,
    },
    launchedAt: start + DEMO_LAUNCH,
    built: clamp01((time - start) / (DEMO_LAUNCH - 400)) * 3,
  };
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

/**
 * A top standing with its tip at (x, y). `parts` says how much is built, 0 to
 * 3 (body, stripes, handle), `angle` is how far it has turned and `lean` how
 * far its handle leans, in pixels.
 */
function top(
  plot: Plot,
  build: Build,
  x: number,
  y: number,
  parts: number,
  angle: number,
  lean: number,
) {
  const { rows } = BODIES[build.body];
  const handle = HANDLES[build.handle];
  const color = STRIPES[build.stripe].color;
  const bodyRows = Math.ceil(Math.min(1, parts) * rows.length);
  for (let r = 0; r < bodyRows; r++) {
    const half = rows[r];
    const shift = Math.round((lean * r) / rows.length);
    for (let dx = -half; dx <= half; dx++) {
      // Stripes wrap round the body, so they slide across as it turns.
      const u = half ? dx / (half + 0.5) : 0;
      const around = Math.asin(Math.max(-1, Math.min(1, u))) + angle;
      const striped = parts > 1 && Math.sin(around * 2) > 0.25 && r > 1 && r < rows.length - 1;
      const painted = striped && (parts >= 2 || dx <= -half + Math.round((parts - 1) * half * 2));
      const base = painted ? color : dx <= 0 ? colors.gold : colors.gingerbread;
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
function lyingTop(plot: Plot, build: Build, x: number, ground: number, angle: number) {
  const { rows } = BODIES[build.body];
  const handle = HANDLES[build.handle];
  const color = STRIPES[build.stripe].color;
  const axis = ground - Math.max(...rows);
  for (let c = 0; c < rows.length; c++) {
    const half = rows[c];
    for (let dy = -half; dy <= half; dy++) {
      const u = half ? dy / (half + 0.5) : 0;
      const around = Math.asin(Math.max(-1, Math.min(1, u))) + angle;
      const striped = Math.sin(around * 2) > 0.25 && c > 1 && c < rows.length - 1;
      const base = striped ? color : dy <= 0 ? colors.gold : colors.gingerbread;
      plot(base, x + c, axis + dy);
    }
  }
  plot(colors.wood, x + rows.length, axis, handle.stem, 1);
  if (handle.cap) plot(colors.cocoa, x + rows.length + handle.stem, axis - 1, 1, 3);
}

/** A small picture of a part for its button, centred on (x, y). */
function partIcon(plot: Plot, part: Part, build: Build, x: number, y: number) {
  if (part === 'stripe') {
    plot(colors.gold, x - 2, y - 2, 5, 5);
    plot(STRIPES[build.stripe].color, x - 2, y - 1, 5, 1);
    plot(STRIPES[build.stripe].color, x - 2, y + 1, 5, 1);
    return;
  }
  if (part === 'body') {
    const { rows } = BODIES[build.body];
    for (let i = 0; i < 5; i++) {
      const half = Math.round(rows[Math.floor((i * rows.length) / 5)] / 2);
      plot(i % 2 ? colors.gingerbread : colors.gold, x - half, y + 2 - i, half * 2 + 1, 1);
    }
    return;
  }
  const handle = HANDLES[build.handle];
  const stem = Math.min(4, handle.stem);
  plot(colors.gold, x - 2, y + 2, 5, 1);
  plot(colors.wood, x, y + 2 - stem, 1, stem);
  if (handle.cap) plot(colors.cocoa, x - 1, y + 1 - stem, 3, 1);
}

/** The font at `height` board pixels. */
function font(size: number, height: number) {
  return canvasFont('small', 'bold').replace(/\d+px/, `${Math.round((size * height) / GRID)}px`);
}

/** The booth's one memory of the pointer: what has been built and tested this visit. */
let workshop = newWorkshop();

const booth: NorthPoleSquare = {
  id: 'sjmaple',
  name: 'Spinning Top Workshop',
  description:
    'Pick a body, stripes and a handle, build your own spinning top, then spin it and see how it tests.',
  draw(ctx, size, time, pointer?: SquarePointer) {
    const plot = pixels(ctx, size);
    const gx = pointer ? (pointer.x / size) * GRID : -1;
    const gy = pointer ? (pointer.y / size) * GRID : -1;
    const hovered = pointer ? buttonAt(gx, gy) : null;
    // A visitor who joins in while the elf is playing carries on from the elf's top.
    if (pointer && pointer.presses > 0 && idle(workshop, time)) {
      workshop = { ...workshop, build: demoAt(time).build };
    }
    workshop = settle(press(workshop, hovered, pointer?.presses ?? 0, time), time);

    // Whose round it is: the visitor's, or the elf's own while nobody plays.
    const demo = idle(workshop, time);
    const elfRound = demoAt(time);
    const build = demo ? elfRound.build : workshop.build;
    // The top out on the mat, and the one the test board reports, is the one let go.
    const tested = demo ? elfRound.build : workshop.tested;
    const launchedAt = demo ? elfRound.launchedAt : workshop.launchedAt;
    const test = launchedAt === null ? null : testOf(tested, launchedAt);
    const since = launchedAt === null ? Infinity : time - launchedAt;
    const { stage, progress } =
      test && since >= 0 ? stageAt(since, test.spin) : { stage: 'done' as Stage, progress: 1 };
    const busy = !demo && testing(workshop, time);

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
      [31, 3, 0],
      [33, 14, 2],
      [29, 9, 4],
      [62, 14, 1],
    ] as const) {
      if (Math.sin(time / 1_200 + phase) > -0.3) plot(colors.glow, sx, sy);
    }

    // The parts board: one button for each part, showing the one picked.
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = font(size, 3.6);
    for (const b of BUTTONS) {
      const part = b.name;
      if (part === 'spin') continue;
      const lit = hovered === part && !busy;
      plot(colors.cocoa, b.x, b.y, b.w, b.h);
      plot(
        busy ? colors.slabShade : lit ? colors.glow : colors.cream,
        b.x + 1,
        b.y + 1,
        b.w - 2,
        b.h - 2,
      );
      partIcon(plot, part, build, b.x + b.w - 5, b.y + b.h / 2 - 0.5);
      const choice =
        part === 'body'
          ? BODIES[build.body].name
          : part === 'stripe'
            ? STRIPES[build.stripe].name
            : HANDLES[build.handle].name;
      ctx.fillStyle = busy ? colors.muted : colors.ink;
      ctx.fillText(
        `${part.toUpperCase()} ${choice}`,
        (size * (b.x + 1.6)) / GRID,
        (size * (b.y + b.h / 2)) / GRID,
        (size * (b.w - 9)) / GRID,
      );
    }

    // The spin button and the test board.
    const sb = BUTTONS[3];
    const ready = !busy;
    plot(colors.cocoa, sb.x, sb.y, sb.w, sb.h);
    plot(
      ready ? (hovered === 'spin' ? colors.glow : colors.gold) : colors.slabShade,
      sb.x + 1,
      sb.y + 1,
      sb.w - 2,
      sb.h - 2,
    );
    ctx.textAlign = 'center';
    ctx.font = font(size, 4.4);
    ctx.fillStyle = ready ? colors.ink : colors.muted;
    ctx.fillText(
      'SPIN IT!',
      (size * (sb.x + sb.w / 2)) / GRID,
      (size * (sb.y + sb.h / 2)) / GRID,
      (size * (sb.w - 3)) / GRID,
    );
    plot(colors.cocoa, 38, 20, 22, 11);
    plot(colors.night, 39, 21, 20, 9);
    ctx.font = font(size, 3.4);
    ctx.fillStyle = colors.glow;
    let line1 = 'PICK PARTS';
    let line2 = 'THEN SPIN';
    if (test && since >= 0 && stage !== 'carry') {
      const spun = stage === 'spin' ? progress * test.spin : test.spin;
      line1 = `${(spun / 1000).toFixed(1)}s`;
      if (stage !== 'spin') line1 += ` ${rating(test.wobble)}`;
      line2 = demo
        ? 'TAP TO BUILD'
        : workshop.best
          ? `BEST ${(workshop.best / 1000).toFixed(1)}s`
          : '';
    } else if (demo) {
      line1 = 'TAP A PART';
      line2 = 'TO BUILD';
    } else if (stage === 'carry') {
      line1 = 'TESTING...';
      line2 = '';
    }
    ctx.fillText(line1, (size * 49) / GRID, (size * 23.6) / GRID, (size * 19) / GRID);
    ctx.fillText(line2, (size * 49) / GRID, (size * 27.6) / GRID, (size * 19) / GRID);

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

    // The elf between the bench and the mat: a hat, a face, a green coat and an arm that hammers.
    const building = demo ? since < 0 : time - workshop.changedAt < HAMMER;
    const ex = 29;
    const ey = bench.y - 12;
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

    // The top: on the bench, then carried, spun and tipped over on the mat.
    const benchTip = { x: bench.x - 2, y: bench.y };
    const matTip = { x: mat.x, y: mat.y };
    if (!test || since < 0 || stage === 'done') {
      const parts = demo && since < 0 ? elfRound.built : 3;
      plot(colors.shadow, benchTip.x - 4, benchTip.y, 9, 1);
      top(plot, build, benchTip.x, benchTip.y, parts, 0, 0);
      if (building && hammer(time) > 0.85) plot(colors.glow, benchTip.x + 6, benchTip.y - 6);
    } else if (stage === 'carry') {
      const tip = carryTip(progress, benchTip, matTip);
      plot(colors.shadow, tip.x - 4, mat.y, 9, 1);
      top(plot, tested, tip.x, tip.y, 3, 0, 0);
    } else {
      const ms = stage === 'spin' ? progress * test.spin : test.spin;
      const angle = spinAngle(ms, test.spin);
      plot(colors.shadow, matTip.x - 4, matTip.y, 9, 1);
      if (stage === 'spin') {
        // A little spray of snow-dust while it is still fast.
        if (spinSpeed(ms, test.spin) > 0.35) {
          for (let i = 0; i < 4; i++) {
            const a = time / 260 + i * 1.6;
            plot(colors.snowLit, matTip.x + Math.round(Math.cos(a) * 8), matTip.y - 1 - (i % 2), 1);
          }
        }
        top(plot, tested, matTip.x, matTip.y, 3, angle, wobble(ms, test));
      } else {
        // Tipping over, then lying still on its side until it goes back on the bench.
        const pose = restPose(progress);
        if (pose.lying) lyingTop(plot, tested, matTip.x - 5, matTip.y, angle);
        else top(plot, tested, matTip.x, matTip.y, 3, angle, pose.lean);
      }
    }

    // The sign.
    plot(colors.cocoa, 38, 3, 1, 5);
    plot(colors.cocoa, 60, 3, 1, 5);
    plot(colors.wood, 36, 1, 26, 8);
    plot(colors.cream, 37, 2, 24, 6);
    ctx.fillStyle = colors.ink;
    ctx.font = font(size, 4.5);
    ctx.textAlign = 'center';
    ctx.fillText('TOP SHOP', (size * 49) / GRID, (size * 5) / GRID, (size * 22) / GRID);
  },
};

export default booth;
