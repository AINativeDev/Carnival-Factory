import { box, glow, iso, scene, shadow } from '../../northpole/diorama';
import type { NorthPoleSquare } from '../../northpole/square';
import { canvasFont, theme } from '../../northpole/theme';

const { colors } = theme;

type Ctx = CanvasRenderingContext2D;

/** One whole round of the depot, in milliseconds. */
export const LOOP = 8_000;

/** Where we are in the loop, 0 to 1. */
export function phase(time: number) {
  return (((time % LOOP) + LOOP) % LOOP) / LOOP;
}

/** 0 to 1, slow at both ends. */
export function ease(t: number) {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
}

/** Santa waves for the first half of the round: twice, the arm rising and settling smoothly. */
export const WAVES = 2;
export function waveAngle(t: number) {
  if (t >= 0.5) return 0;
  const raise = ease(t / 0.08) * ease((0.5 - t) / 0.08);
  return raise * (2.1 + 0.4 * Math.sin((t / 0.5) * WAVES * Math.PI * 2 - Math.PI / 2));
}

/** The stack's parcels: how many sit on it, and how far through its fall a new one is. */
export const STACK_SIZE = 3;
export const PICKUP = 0.12;
export const DROP_START = 0.7;
export const DROP_END = 0.82;
export function stackAt(t: number): { settled: number; falling: number | null } {
  if (t < PICKUP) return { settled: STACK_SIZE, falling: null };
  if (t < DROP_START) return { settled: STACK_SIZE - 1, falling: null };
  if (t < DROP_END) {
    return { settled: STACK_SIZE - 1, falling: (t - DROP_START) / (DROP_END - DROP_START) };
  }
  return { settled: STACK_SIZE, falling: null };
}

/** How far along the stack to sleigh path the carrying elf is (0 at the stack, 1 at the sleigh), and whether the parcel is in their arms. */
export function elfWalk(t: number): { pos: number; carrying: boolean; moving: boolean } {
  let pos = 0;
  if (t < 0.2) pos = 0;
  else if (t < 0.45) pos = ease((t - 0.2) / 0.25);
  else if (t < 0.58) pos = 1;
  else if (t < 0.9) pos = 1 - ease((t - 0.58) / 0.32);
  const moving = (t >= 0.2 && t < 0.45) || (t >= 0.58 && t < 0.9);
  return { pos, carrying: t >= PICKUP && t < 0.5, moving };
}

/** The parcel the elves pass into the sleigh: null when there is none, else its stage and progress through it. */
export function handoffAt(t: number): { stage: 'pass' | 'stow'; progress: number } | null {
  if (t >= 0.5 && t < 0.62) return { stage: 'pass', progress: (t - 0.5) / 0.12 };
  if (t >= 0.62 && t < 0.95) return { stage: 'stow', progress: (t - 0.62) / 0.33 };
  return null;
}

/** How far up the head of the reindeer that looks round is, 0 grazing to 1 looking up. */
export function headLift(t: number) {
  return ease((t - 0.3) / 0.1) * ease((0.72 - t) / 0.1);
}

/** The ear flick of the reindeer that looks up: a quick wiggle while its head is up, still otherwise. */
export function earFlick(t: number) {
  if (t < 0.45 || t > 0.58) return 0;
  return Math.sin(((t - 0.45) / 0.13) * Math.PI * 4) * ease((0.58 - t) / 0.03);
}

/** How bright the gate lantern is: a slow, gentle breathing, two breaths a round. */
export function lanternAt(t: number) {
  return 0.8 + 0.2 * Math.sin(t * Math.PI * 4);
}

export interface Flake {
  x: number;
  y: number;
  r: number;
}

/** Snowflake `n`: falls once or twice a round and sways, so the loop repeats exactly. */
export function flake(n: number, t: number): Flake {
  const fall = 1 + (n % 2);
  const y = (((n * 0.173 + t * fall) % 1) + 1) % 1;
  return {
    x: ((n * 37) % 100) + 3 * Math.sin((t + n * 0.37) * Math.PI * 2),
    y: y * 96 + 2,
    r: 0.35 + (n % 3) * 0.12,
  };
}

const FLAKES = 28;

function poly(ctx: Ctx, color: string, points: { x: number; y: number }[], alpha = 1) {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  points.forEach((p, n) => (n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function circle(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, tilt = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, tilt, 0, Math.PI * 2);
  ctx.fill();
}

function line(ctx: Ctx, color: string, width: number, ...pts: [number, number][]) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

/** The shaded right face of a box, to darken it. */
function rightShade(
  ctx: Ctx,
  gx: number,
  gy: number,
  w: number,
  d: number,
  h: number,
  lift: number,
  alpha: number,
) {
  poly(
    ctx,
    colors.shadow,
    [
      iso(gx + w, gy + d, lift),
      iso(gx + w, gy, lift),
      iso(gx + w, gy, lift + h),
      iso(gx + w, gy + d, lift + h),
    ],
    alpha,
  );
}

function leftFace(
  ctx: Ctx,
  gx: number,
  gy: number,
  w: number,
  d: number,
  h: number,
  lift: number,
  color: string,
) {
  poly(ctx, color, [
    iso(gx, gy + d, lift),
    iso(gx + w, gy + d, lift),
    iso(gx + w, gy + d, lift + h),
    iso(gx, gy + d, lift + h),
  ]);
}

/** A parcel in violet paper with a gold ribbon and bow, standing on the ground at (gx, gy). */
function parcel(ctx: Ctx, gx: number, gy: number, lift: number) {
  const w = 4;
  const d = 4;
  const h = 3.6;
  box(ctx, gx, gy, w, d, h, colors.violet, colors.violet, colors.violet, lift);
  rightShade(ctx, gx, gy, w, d, h, lift, 0.32);
  poly(
    ctx,
    colors.snowLit,
    [
      iso(gx, gy, lift + h),
      iso(gx + w, gy, lift + h),
      iso(gx + w, gy + d, lift + h),
      iso(gx, gy + d, lift + h),
    ],
    0.2,
  );
  const m = w / 2;
  const r = 0.45;
  // Ribbon over the top, down the lit side and down the shaded side.
  poly(ctx, colors.gold, [
    iso(gx + m - r, gy, lift + h),
    iso(gx + m + r, gy, lift + h),
    iso(gx + m + r, gy + d, lift + h),
    iso(gx + m - r, gy + d, lift + h),
  ]);
  poly(ctx, colors.gold, [
    iso(gx + m - r, gy + d, lift),
    iso(gx + m + r, gy + d, lift),
    iso(gx + m + r, gy + d, lift + h),
    iso(gx + m - r, gy + d, lift + h),
  ]);
  poly(ctx, colors.gold, [
    iso(gx + w, gy + m - r, lift),
    iso(gx + w, gy + m + r, lift),
    iso(gx + w, gy + m + r, lift + h),
    iso(gx + w, gy + m - r, lift + h),
  ]);
  rightShade(ctx, gx + w - 0.001, gy + m - r, 0.001, 2 * r, h, lift, 0.32);
  const bow = iso(gx + m, gy + m, lift + h);
  circle(ctx, bow.x - 0.5, bow.y - 0.4, 0.55, colors.gold);
  circle(ctx, bow.x + 0.5, bow.y - 0.4, 0.55, colors.gold);
}

/** A parcel carried or passed, seen from the front, `s` wide, with its centre at (x, y). */
function flatParcel(ctx: Ctx, x: number, y: number, s: number) {
  ctx.fillStyle = colors.violet;
  ctx.fillRect(x - s / 2, y - s * 0.45, s, s * 0.9);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(x, y - s * 0.45, s / 2, s * 0.9);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - s * 0.1, y - s * 0.45, s * 0.2, s * 0.9);
  ctx.fillRect(x - s / 2, y - s * 0.08, s, s * 0.16);
}

/** Posts and two rails along one edge of the paddock. */
function fence(ctx: Ctx, gx0: number, gy0: number, gx1: number, gy1: number, posts: number) {
  for (const z of [2.2, 4.6]) {
    const a = iso(gx0, gy0, z);
    const b = iso(gx1, gy1, z);
    line(ctx, colors.wood, 0.7, [a.x, a.y], [b.x, b.y]);
  }
  for (let i = 0; i <= posts; i++) {
    const k = i / posts;
    const base = iso(gx0 + (gx1 - gx0) * k, gy0 + (gy1 - gy0) * k, 0);
    const top = iso(gx0 + (gx1 - gx0) * k, gy0 + (gy1 - gy0) * k, 6);
    line(ctx, colors.cocoa, 1, [base.x, base.y], [top.x, top.y]);
    circle(ctx, top.x, top.y - 0.2, 0.55, colors.snow);
  }
}

interface ReindeerPose {
  x: number;
  y: number;
  lift: number;
  ears: number;
  chew: number;
}

/** A reindeer facing left, standing on (x, y). `lift` is 0 with its head down grazing, 1 with it up. */
function reindeer(ctx: Ctx, { x, y, lift, ears, chew }: ReindeerPose) {
  shadow(ctx, x, y + 0.4, 10);
  // The far legs, then the body, then the near legs.
  for (const dx of [-2.6, 2.8])
    line(ctx, colors.cocoa, 0.9, [x + dx + 0.8, y - 4], [x + dx + 0.8, y]);
  ellipse(ctx, x + 0.5, y - 5.4, 4.6, 2.5, colors.gingerbread);
  ellipse(ctx, x + 2.6, y - 4.6, 2.4, 1.2, colors.snowLit);
  for (const dx of [-3.2, 2.2]) line(ctx, colors.wood, 0.9, [x + dx, y - 4], [x + dx, y]);
  ctx.globalAlpha = 0.2;
  ellipse(ctx, x + 2.5, y - 5, 2.4, 2.2, colors.shadow);
  ctx.globalAlpha = 1;
  // The tail.
  circle(ctx, x + 5.2, y - 6.2, 0.9, colors.snowLit);
  // Neck and head.
  const hx = x - 4.8 - (1 - lift) * 1.6;
  const hy = y - 7.2 - lift * 4.6 + (1 - lift) * 5.4 + chew;
  line(ctx, colors.gingerbread, 1.9, [x - 3, y - 6.2], [hx + 0.6, hy + 0.4]);
  ellipse(ctx, hx - 0.6, hy, 1.7, 1.1, colors.gingerbread, -0.35 + (1 - lift) * 0.9);
  circle(ctx, hx - 1.9, hy + 0.5 + (1 - lift) * 0.5, 0.35, colors.ink);
  circle(ctx, hx - 0.4, hy - 0.4, 0.22, colors.ink);
  // Ears, which flick, and antlers.
  line(
    ctx,
    colors.gingerbread,
    0.8,
    [hx + 0.3, hy - 0.8],
    [hx + 1.2 + ears * 0.8, hy - 2 - ears * 0.6],
  );
  line(ctx, colors.cocoa, 0.35, [hx, hy - 1], [hx - 0.4, hy - 3.2], [hx - 1.4, hy - 4]);
  line(ctx, colors.cocoa, 0.35, [hx - 0.4, hy - 2.6], [hx + 0.6, hy - 3.6]);
}

interface ElfPose {
  x: number;
  y: number;
  face: 1 | -1;
  stride: number;
  arms: number;
  holding: boolean;
}

/** An elf in a green coat and an aurora-trimmed cap. `arms` is 0 with them down, 1 reaching up; `stride` swings the legs. */
function elf(ctx: Ctx, { x, y, face, stride, arms, holding }: ElfPose) {
  shadow(ctx, x, y + 0.3, 6);
  const swing = Math.sin(stride) * 1.2;
  line(ctx, colors.ink, 1.1, [x - 0.7, y - 2.6], [x - 0.7 + swing * face, y]);
  line(ctx, colors.ink, 1.1, [x + 0.7, y - 2.6], [x + 0.7 - swing * face, y]);
  poly(ctx, colors.pine, [
    { x: x - 2.1, y: y - 2.4 },
    { x: x + 2.1, y: y - 2.4 },
    { x: x + 1.5, y: y - 6.4 },
    { x: x - 1.5, y: y - 6.4 },
  ]);
  poly(
    ctx,
    colors.pineDark,
    [
      { x: x + 0.2, y: y - 2.4 },
      { x: x + 2.1, y: y - 2.4 },
      { x: x + 1.5, y: y - 6.4 },
      { x: x + 0.2, y: y - 6.4 },
    ],
    0.7,
  );
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 2, y - 3.9, 4, 0.7);
  // Arms: down at the sides, forward holding a parcel, or reaching up.
  const reach = holding ? 0.5 : arms;
  line(
    ctx,
    colors.pine,
    0.9,
    [x + face * 1.4, y - 5.8],
    [x + face * (2.3 + reach), y - 4.6 - reach * 2.6],
  );
  line(
    ctx,
    colors.pine,
    0.9,
    [x - face * 1.4, y - 5.8],
    [x - face * 0.2 + face * reach, y - 4.4 - reach * 3],
  );
  if (holding) flatParcel(ctx, x + face * 3.4, y - 5.6, 3.2);
  circle(ctx, x, y - 8, 1.8, colors.horizon);
  circle(ctx, x + face * 0.7, y - 8.2, 0.22, colors.ink);
  // Cap, with a bobble and an aurora band.
  poly(ctx, colors.pine, [
    { x: x - 1.9, y: y - 8.7 },
    { x: x + 1.9, y: y - 8.7 },
    { x: x - face * 0.6, y: y - 12.6 },
  ]);
  ctx.fillStyle = colors.aurora;
  ctx.fillRect(x - 1.95, y - 9, 3.9, 0.7);
  circle(ctx, x - face * 0.6, y - 12.8, 0.6, colors.gold);
  // Pointed ears.
  poly(ctx, colors.horizon, [
    { x: x - 1.7, y: y - 8 },
    { x: x - 3, y: y - 8.9 },
    { x: x - 1.6, y: y - 8.9 },
  ]);
  poly(ctx, colors.horizon, [
    { x: x + 1.7, y: y - 8 },
    { x: x + 3, y: y - 8.9 },
    { x: x + 1.6, y: y - 8.9 },
  ]);
}

/** Santa in his red coat, waving with his left arm at `wave` radians up from his side and holding a parcel in the other. */
function santa(ctx: Ctx, x: number, y: number, wave: number) {
  shadow(ctx, x, y + 0.4, 9);
  line(ctx, colors.ink, 1.6, [x - 1.2, y - 3.5], [x - 1.3, y]);
  line(ctx, colors.ink, 1.6, [x + 1.2, y - 3.5], [x + 1.3, y]);
  poly(ctx, colors.berry, [
    { x: x - 3.3, y: y - 3.6 },
    { x: x + 3.3, y: y - 3.6 },
    { x: x + 2.4, y: y - 11 },
    { x: x - 2.4, y: y - 11 },
  ]);
  poly(
    ctx,
    colors.shadow,
    [
      { x: x + 0.6, y: y - 3.6 },
      { x: x + 3.3, y: y - 3.6 },
      { x: x + 2.4, y: y - 11 },
      { x: x + 0.6, y: y - 11 },
    ],
    0.3,
  );
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 3.4, y - 4.2, 6.8, 0.9);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(x - 3, y - 7.2, 6, 0.9);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 0.6, y - 7.3, 1.2, 1.1);
  // The waving arm, from the shoulder, and the one with the parcel.
  const sx = x - 2.4;
  const sy = y - 10;
  const ex = sx - Math.sin(wave) * 4.6;
  const ey = sy + Math.cos(wave) * 4.6;
  line(ctx, colors.berry, 1.3, [sx, sy], [ex, ey]);
  circle(ctx, ex, ey, 0.9, colors.snow);
  line(ctx, colors.berry, 1.3, [x + 2.4, y - 10], [x + 3.6, y - 7.4]);
  flatParcel(ctx, x + 3.4, y - 6.4, 3.4);
  circle(ctx, x + 3.4, y - 7.3, 0.8, colors.snow);
  // Head, beard, cap.
  circle(ctx, x, y - 13, 2.3, colors.horizon);
  ellipse(ctx, x, y - 11.6, 2.4, 1.9, colors.snow);
  circle(ctx, x - 0.8, y - 13.3, 0.25, colors.ink);
  circle(ctx, x + 0.8, y - 13.3, 0.25, colors.ink);
  circle(ctx, x, y - 12.5, 0.4, colors.berry);
  poly(ctx, colors.berry, [
    { x: x - 2.5, y: y - 14.2 },
    { x: x + 2.5, y: y - 14.2 },
    { x: x + 1.4, y: y - 18.4 },
  ]);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 2.7, y - 15, 5.4, 1);
  circle(ctx, x + 1.5, y - 18.6, 0.8, colors.snow);
}

/** The gate's two posts, the sign between them, the clipboard and the lantern. */
function gate(ctx: Ctx, lantern: number) {
  const left = iso(16, 20);
  const right = iso(16, 4);
  const top = 16;
  for (const gy of [20, 4]) {
    box(ctx, 15, gy - 1, 2, 2, top, colors.wood, colors.wood, colors.cocoa);
    rightShade(ctx, 15, gy - 1, 2, 2, top, 0, 0.25);
    const cap = iso(16, gy, top + 0.4);
    ellipse(ctx, cap.x, cap.y, 1.9, 0.9, colors.snow);
  }
  // The sign over the gate hangs level across the posts.
  const a = iso(16, 20.8, top - 1);
  const b = iso(16, 3.2, top - 1);
  const slope = (b.y - a.y) / (b.x - a.x);
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.transform(1, slope, 0, 1, 0, 0);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(0, -1, b.x - a.x, 5.4);
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(0.4, -0.6, b.x - a.x - 0.8, 4.6);
  ctx.fillStyle = colors.cocoa;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.scale(0.17, 0.17);
  ctx.fillText('Parcel Depot', (b.x - a.x) / 2 / 0.17, 1.7 / 0.17, 14.8 / 0.17);
  ctx.restore();
  ctx.restore();
  // A clipboard on the left post, with its paper.
  const board = { x: left.x - 2.2, y: left.y - 11 };
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(board.x, board.y, 3.2, 4.4);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(board.x + 0.4, board.y + 0.7, 2.4, 3.4);
  for (let i = 0; i < 3; i++)
    line(
      ctx,
      colors.ink,
      0.2,
      [board.x + 0.7, board.y + 1.6 + i * 0.9],
      [board.x + 2.5, board.y + 1.6 + i * 0.9],
    );
  ctx.fillStyle = colors.gold;
  ctx.fillRect(board.x + 1, board.y - 0.3, 1.2, 0.8);
  // The lantern on the right post, glowing softly.
  const hook = { x: right.x + 1.2, y: right.y - top + 3 };
  line(ctx, colors.cocoa, 0.5, [hook.x, hook.y], [hook.x + 2.8, hook.y]);
  line(ctx, colors.cocoa, 0.25, [hook.x + 2.8, hook.y], [hook.x + 2.8, hook.y + 1]);
  glow(ctx, hook.x + 2.8, hook.y + 2.6, 8, lantern);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(hook.x + 1.8, hook.y + 1, 2, 0.5);
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.6 + 0.4 * lantern;
  ctx.fillRect(hook.x + 2, hook.y + 1.5, 1.6, 2.2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(hook.x + 1.8, hook.y + 3.7, 2, 0.5);
}

const STACK_AT = [
  { gx: -20, gy: -7, lift: 0 },
  { gx: -20, gy: -2, lift: 0 },
  { gx: -20, gy: -4.5, lift: 3.6 },
];
const SLEIGH = { gx: -14, gy: -18, w: 12, d: 7, h: 4, lift: 1 };

function paint(ctx: Ctx, time: number) {
  const t = phase(time);

  // Trampled snow in the paddock, and hoof prints.
  const pad = [iso(10, -20), iso(22, -20), iso(22, -6), iso(10, -6)];
  poly(ctx, colors.snowShade, pad, 0.55);
  for (const [gx, gy, a] of [
    [12.5, -8.5, 0],
    [14.5, -9.5, 0.3],
    [16, -16, 0.2],
    [18, -17, 0],
    [20, -9, 0.3],
    [13, -16, 0.1],
  ]) {
    const p = iso(gx, gy);
    ellipse(ctx, p.x, p.y, 0.55, 0.3, colors.slabShade, a);
    ellipse(ctx, p.x + 1.1, p.y + 0.35, 0.55, 0.3, colors.slabShade, a);
  }

  // Back fences, then the reindeer, then the front fences.
  fence(ctx, 10, -6, 10, -20, 4);
  fence(ctx, 10, -20, 22, -20, 4);
  const grazer = iso(13, -10);
  reindeer(ctx, {
    x: grazer.x,
    y: grazer.y,
    lift: 0,
    ears: 0,
    chew: Math.sin(t * Math.PI * 2 * 6) * 0.25,
  });
  const looker = iso(18, -14);
  reindeer(ctx, {
    x: looker.x,
    y: looker.y,
    lift: headLift(t),
    ears: earFlick(t),
    chew: 0,
  });
  fence(ctx, 10, -6, 22, -6, 4);
  fence(ctx, 22, -6, 22, -20, 4);

  // The stack, the sleigh and its load.
  const stack = stackAt(t);
  STACK_AT.slice(0, stack.settled).forEach((p) => parcel(ctx, p.gx, p.gy, p.lift));
  if (stack.falling !== null) {
    const top = STACK_AT[2];
    parcel(ctx, top.gx, top.gy, top.lift + 26 * (1 - stack.falling * stack.falling));
  }

  const s = SLEIGH;
  for (const gy of [s.gy + 0.8, s.gy + s.d - 0.8]) {
    const a = iso(s.gx - 1, gy);
    const b = iso(s.gx + s.w, gy);
    const c = iso(s.gx + s.w + 2.4, gy, 3.2);
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 0.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.quadraticCurveTo(b.x + 2.2, b.y, c.x, c.y);
    ctx.stroke();
  }
  shadow(ctx, iso(-8, -14).x + 2, iso(-8, -14).y + 3, 22);
  box(ctx, s.gx, s.gy, s.w, s.d, s.h, colors.cocoa, colors.berry, colors.berry, s.lift);
  parcel(ctx, -12.5, -16.5, 2.4);
  parcel(ctx, -8.5, -15.5, 2.4);
  const stowed = handoffAt(t);
  const rim = { x: iso(-8, -14).x, y: iso(-8, -14, s.lift + s.h).y - 1.6 };
  const hands = { x: iso(-10, -6).x + 3.4, y: iso(-10, -6).y - 8.6 };
  if (stowed?.stage === 'pass') {
    const k = ease(stowed.progress);
    flatParcel(
      ctx,
      hands.x + (rim.x - hands.x) * k,
      hands.y + (rim.y - 4 - hands.y) * k - Math.sin(k * Math.PI) * 2,
      3.4,
    );
  } else if (stowed) {
    const k = ease(stowed.progress);
    ctx.globalAlpha = 1 - ease((stowed.progress - 0.55) / 0.4);
    flatParcel(ctx, rim.x, rim.y - 4 + k * 8, 3.4);
    ctx.globalAlpha = 1;
  }
  // The sleigh's front faces cover whatever has sunk inside.
  leftFace(ctx, s.gx, s.gy, s.w, s.d, s.h, s.lift, colors.berry);
  poly(ctx, colors.berry, [
    iso(s.gx + s.w, s.gy + s.d, s.lift),
    iso(s.gx + s.w, s.gy, s.lift),
    iso(s.gx + s.w, s.gy, s.lift + s.h),
    iso(s.gx + s.w, s.gy + s.d, s.lift + s.h),
  ]);
  rightShade(ctx, s.gx, s.gy, s.w, s.d, s.h, s.lift, 0.3);
  const trim = [
    iso(s.gx, s.gy + s.d, s.lift + s.h - 0.8),
    iso(s.gx + s.w, s.gy + s.d, s.lift + s.h - 0.8),
  ];
  line(ctx, colors.gold, 0.5, [trim[0].x, trim[0].y], [trim[1].x, trim[1].y]);

  // The elves.
  const walk = elfWalk(t);
  const from = iso(-15, -3);
  const to = iso(-12, -7);
  const catching = t >= 0.42 && t < 0.64 ? ease((t - 0.42) / 0.08) * ease((0.64 - t) / 0.08) : 0;
  const second = iso(-8, -6);
  elf(ctx, {
    x: second.x,
    y: second.y,
    face: -1,
    stride: 0,
    arms: catching,
    holding: false,
  });
  elf(ctx, {
    x: from.x + (to.x - from.x) * walk.pos,
    y:
      from.y +
      (to.y - from.y) * walk.pos +
      (walk.moving ? -Math.abs(Math.sin(t * Math.PI * 40)) * 0.5 : 0),
    face: walk.moving && t >= 0.58 ? -1 : 1,
    stride: t * Math.PI * 40,
    arms: 0,
    holding: walk.carrying,
  });

  // The gate, and Santa beside it.
  const santaAt = iso(12, 21);
  santa(ctx, santaAt.x, santaAt.y, waveAngle(t));
  gate(ctx, lanternAt(t));

  // Snow falls over everything.
  ctx.fillStyle = colors.snow;
  for (let n = 0; n < FLAKES; n++) {
    const f = flake(n, t);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

const booth: NorthPoleSquare = {
  id: 'pstember',
  name: 'North Pole Parcel Depot',
  description:
    'Santa waves at the gate while elves load parcels onto a sleigh and the reindeer graze.',
  stall: { shape: 'shed', roof: 'gold' },
  draw(ctx, size, time) {
    scene(ctx, size, time, paint);
  },
};

export default booth;
