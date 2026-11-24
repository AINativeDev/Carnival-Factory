import type { NorthPoleSquare, SquarePointer } from '../../northpole/square';
import { canvasFont, theme } from '../../northpole/theme';

const { colors } = theme;

/** Things on the course: one every `SPACING` metres, the first two spacings in. */
export const SPACING = 9;

/** How far ahead the sled can see, in metres. */
export const VIEW = 70;

/** Half the width of the track: lanes run from -1.2 to 1.2 with a margin of snow beyond. */
export const TRACK = 1.4;
export const EDGE = 1.2;

/** Points for each snowflake scooped up. */
export const POINTS = 10;

/** The slope's speed in metres a second: it starts at `BASE` and gains `ACCEL` a second up to `TOP`. */
export const BASE = 9;
export const ACCEL = 0.3;
export const TOP = 20;

/** How fast the penguin can cross the track, in lanes a second. */
export const STEER = 3;
/** How far one tap on either half of the drawing steers. */
export const TAP_STEP = 0.8;

/** How close in lanes the penguin must pass to hit a rock or drift, or to scoop a snowflake. */
export const HIT = 0.38;
export const CATCH = 0.42;

/** A run nobody steers starts again after this many seconds, and after a crash after `REST` ms. */
export const DEMO = 40;
export const REST = 1_500;
/** A crashed player's tap starts a new run once the tumble has had this long, in ms. */
export const TUMBLE = 400;

export type Kind = 'flake' | 'rock' | 'drift';

export interface Thing {
  index: number;
  kind: Kind;
  /** Metres from the start of the run. */
  distance: number;
  /** Across the track, -1.2 left to 1.2 right. */
  lane: number;
}

/** One run down the mountain. */
export interface Run {
  seed: number;
  /** The `time` it started. */
  start: number;
  distance: number;
  lane: number;
  /** The lane the penguin is steering for. */
  target: number;
  score: number;
  /** The `time` it hit something, or null while it is still going. */
  crashedAt: number | null;
  /** Whether a person steered it, so it counts towards the best. */
  played: boolean;
}

/** All the booth remembers, for one visit. */
export interface Game {
  run: Run;
  best: number;
  runs: number;
  /** The `time` of the last frame. */
  last: number;
  /** Steering by taps on either half, rather than by following the pointer. */
  tapping: boolean;
  lastX: number | null;
}

/** Wraps `value` into [0, `span`), negative values included. */
function wrap(value: number, span: number) {
  return ((value % span) + span) % span;
}

function clamp(value: number, low: number, high: number) {
  return Math.min(high, Math.max(low, value));
}

/** A number from 0 to 1 that is always the same for the same seed, index and salt. */
export function random(seed: number, index: number, salt: number): number {
  const s = Math.sin(seed * 127.1 + index * 311.7 + salt * 74.7) * 43_758.5453;
  return s - Math.floor(s);
}

/** How far the slope has carried the sled `seconds` into a run, speeding up to `TOP`. */
export function distanceFor(seconds: number): number {
  const t = Math.max(0, seconds);
  const toTop = (TOP - BASE) / ACCEL;
  if (t <= toTop) return BASE * t + 0.5 * ACCEL * t * t;
  return BASE * toTop + 0.5 * ACCEL * toTop * toTop + TOP * (t - toTop);
}

/** The slope's speed `seconds` into a run, in metres a second. */
export function speedFor(seconds: number): number {
  return Math.min(TOP, BASE + ACCEL * Math.max(0, seconds));
}

/** The clear line down this run's course: the penguin weaves along it when nobody steers. */
export function pathAt(seed: number, distance: number): number {
  return 0.55 * Math.sin((distance / 80) * Math.PI * 2 + seed * 1.7);
}

/**
 * Thing `index` on a run's course. Snowflakes lie near the clear line, and rocks
 * and snowdrifts sit at least 0.75 lanes to one side of it, so there is always a
 * way through.
 */
export function thingAt(seed: number, index: number): Thing {
  const distance = (index + 2) * SPACING;
  const path = pathAt(seed, distance);
  const pick = random(seed, index, 1);
  const spread = random(seed, index, 2);
  if (pick < 0.4) {
    return {
      index,
      kind: 'flake',
      distance,
      lane: clamp(path + (spread - 0.5) * 1.2, -EDGE, EDGE),
    };
  }
  let side = random(seed, index, 3) < 0.5 ? -1 : 1;
  let lane = path + side * (0.75 + spread * 0.4);
  if (Math.abs(lane) > EDGE) {
    side = -side;
    lane = path + side * (0.75 + spread * 0.4);
  }
  return { index, kind: pick < 0.7 ? 'rock' : 'drift', distance, lane: clamp(lane, -EDGE, EDGE) };
}

/** The things whose distance is after `from` and up to `to`, nearest first. */
export function thingsBetween(seed: number, from: number, to: number): Thing[] {
  const found: Thing[] = [];
  const first = Math.max(0, Math.floor(from / SPACING) - 2);
  for (let i = first; (i + 2) * SPACING <= to; i++) {
    const t = thingAt(seed, i);
    if (t.distance > from) found.push(t);
  }
  return found;
}

/** Where on the track the pointer at `x` across a `size` square steers to. */
export function laneOf(x: number, size: number): number {
  return clamp((x / size - 0.5) * 2 * EDGE * 1.15, -EDGE, EDGE);
}

/** Moves `from` towards `to` by at most `step`. */
export function toward(from: number, to: number, step: number): number {
  if (Math.abs(to - from) <= step) return to;
  return from + Math.sign(to - from) * step;
}

export function newRun(seed: number, start: number, lane = 0, played = false): Run {
  return { seed, start, distance: 0, lane, target: lane, score: 0, crashedAt: null, played };
}

export function newGame(time: number): Game {
  return { run: newRun(1, time), best: 0, runs: 1, last: time, tapping: false, lastX: null };
}

function restart(game: Game, time: number, played: boolean): Game {
  const runs = game.runs + 1;
  return { ...game, runs, last: time, run: newRun(runs, time, game.run.lane, played) };
}

/**
 * The game one frame on, at `time`, with the pointer as it is now. With no
 * pointer the penguin weaves along the clear line on its own, and starts again
 * after a crash or a long run. A person steers by the pointer's place across the
 * drawing, or by taps on either half, and a tap after a crash starts a new run.
 */
export function advance(
  game: Game,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
): Game {
  if (time < game.last) return newGame(time);
  const dt = Math.min(0.25, (time - game.last) / 1000);
  const { run } = game;
  let { tapping, lastX } = game;

  if (run.crashedAt !== null) {
    const since = time - run.crashedAt;
    if (pointer && pointer.presses > 0 && since > TUMBLE) return restart(game, time, true);
    if (!pointer && since > REST) return restart(game, time, false);
    return { ...game, last: time, lastX: pointer ? pointer.x : null };
  }

  let target = run.target;
  let played = run.played;
  if (!pointer) {
    tapping = false;
    lastX = null;
    target = pathAt(run.seed, run.distance);
  } else if (pointer.presses > 0) {
    tapping = true;
    lastX = pointer.x;
    target = clamp(
      target + (pointer.x < size / 2 ? -1 : 1) * TAP_STEP * pointer.presses,
      -EDGE,
      EDGE,
    );
    played = true;
  } else if (!tapping || lastX === null || Math.abs(pointer.x - lastX) > size * 0.02) {
    tapping = false;
    lastX = pointer.x;
    target = laneOf(pointer.x, size);
    played = true;
  }

  const seconds = (time - run.start) / 1000;
  if (!played && seconds > DEMO) return restart(game, time, false);

  const lane = toward(run.lane, target, STEER * dt);
  const distance = distanceFor(seconds);
  let score = run.score;
  let crashedAt: number | null = null;
  for (const t of thingsBetween(run.seed, run.distance, distance)) {
    const gap = Math.abs(t.lane - lane);
    if (t.kind === 'flake') {
      if (gap < CATCH) score += POINTS;
    } else if (gap < HIT) {
      crashedAt = time;
      break;
    }
  }

  const next: Run = { ...run, distance, lane, target, score, crashedAt, played };
  return {
    ...game,
    run: next,
    best: played ? Math.max(game.best, score) : game.best,
    last: time,
    tapping,
    lastX,
  };
}

/** How big something `ahead` metres away looks: 1 at the sled, shrinking to the horizon. */
export function scaleAt(ahead: number): number {
  return 6 / (6 + ahead);
}

/** The things in view `distance` metres down a run, furthest first, so nearer ones draw over them. */
export function inView(seed: number, distance: number): { thing: Thing; ahead: number }[] {
  return thingsBetween(seed, distance + 0.6, distance + VIEW)
    .map((thing) => ({ thing, ahead: thing.distance - distance }))
    .reverse();
}

/** How far the camera looks to the side: it follows the penguin part of the way. */
export function cameraLane(lane: number): number {
  return lane * 0.6;
}

/** Snowflake `index` drifting past in the air, as 0 to 1 across and down. */
export function drift(index: number, time: number): { x: number; y: number } {
  const fall = 6_000 + (index % 3) * 1_500;
  return {
    y: wrap(time / fall + index * 0.41, 1),
    x: wrap(index * 0.27 + Math.sin(time / 1_700 + index) * 0.05, 1),
  };
}

type Ctx = CanvasRenderingContext2D;

const HORIZON = 36;
const GROUND = 92;

/** Where something `ahead` metres away at `lane` stands on the screen. */
export function project(lane: number, ahead: number, camera: number) {
  const k = scaleAt(ahead);
  return {
    k,
    x: 50 + (lane - camera) * 36 * k,
    y: HORIZON + (GROUND - HORIZON) * k,
  };
}

function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function sky(ctx: Ctx, time: number) {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, colors.dusk);
  g.addColorStop(0.6, colors.duskLow);
  g.addColorStop(1, colors.horizon);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 100, HORIZON + 1);

  // A low, warm sun, and soft clouds that drift.
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = colors.lantern;
  blob(ctx, 72, HORIZON - 3, 14, 11);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.glow;
  blob(ctx, 72, HORIZON - 3, 6, 6);
  ctx.fillStyle = colors.cloud;
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 3; i++) {
    const x = wrap(i * 40 + time / 900, 140) - 20;
    blob(ctx, x, 8 + i * 6, 11, 2.6);
    blob(ctx, x + 5, 6.5 + i * 6, 6, 2.4);
  }
  ctx.globalAlpha = 1;

  // Far mountains, with the run's own mountain behind.
  ctx.fillStyle = colors.mountainFar;
  ctx.beginPath();
  ctx.moveTo(0, HORIZON);
  ctx.lineTo(0, 27);
  ctx.quadraticCurveTo(14, 16, 28, 29);
  ctx.quadraticCurveTo(40, 21, 55, 30);
  ctx.quadraticCurveTo(75, 14, 100, 28);
  ctx.lineTo(100, HORIZON);
  ctx.fill();
  ctx.fillStyle = colors.mountain;
  ctx.beginPath();
  ctx.moveTo(0, HORIZON);
  ctx.quadraticCurveTo(25, 28, 45, 34);
  ctx.quadraticCurveTo(70, 26, 100, HORIZON);
  ctx.fill();
}

function slope(ctx: Ctx, camera: number, here: number) {
  // The snowy hillside either side of the track.
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(0, HORIZON, 100, 100 - HORIZON);

  // Soft bands of light and shade rushing towards you.
  for (let i = 0; i < 30; i++) {
    const ahead0 = i * 2.4 - wrap(here, 2.4) + 0.001;
    const ahead1 = ahead0 + 1.2;
    if (ahead1 <= 0) continue;
    const a = project(0, Math.max(0, ahead0), 0);
    const b = project(0, ahead1, 0);
    ctx.fillStyle = colors.snowLit;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(0, b.y, 100, a.y - b.y);
  }
  ctx.globalAlpha = 1;

  // The track: a paler ribbon of snow, curving with the camera.
  const near = project(0, 0, camera);
  const far = project(0, VIEW, camera);
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.moveTo(near.x - TRACK * 36, near.y);
  ctx.lineTo(far.x - TRACK * 36 * far.k, far.y);
  ctx.lineTo(far.x + TRACK * 36 * far.k, far.y);
  ctx.lineTo(near.x + TRACK * 36, near.y);
  ctx.fill();
  ctx.fillStyle = colors.slab;
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(near.x + sign * TRACK * 36, near.y);
    ctx.lineTo(far.x + sign * TRACK * 36 * far.k, far.y);
    ctx.lineTo(far.x + sign * (TRACK * 36 * far.k + 0.4), far.y);
    ctx.lineTo(near.x + sign * (TRACK * 36 + 3), near.y);
    ctx.fill();
  }

  // Snow-capped pines along both edges.
  for (let i = 0; i < 12; i++) {
    const ahead = i * 6 - wrap(here, 6) + 6;
    if (ahead < 0.6 || ahead > VIEW) continue;
    for (const sign of [-1, 1]) {
      const p = project(sign * 2.3, ahead, camera);
      const h = 22 * p.k;
      const w = 7 * p.k;
      ctx.fillStyle = colors.pineDark;
      ctx.beginPath();
      ctx.moveTo(p.x - w, p.y);
      ctx.lineTo(p.x + w, p.y);
      ctx.lineTo(p.x, p.y - h);
      ctx.fill();
      ctx.fillStyle = colors.snow;
      ctx.beginPath();
      ctx.moveTo(p.x - w * 0.45, p.y - h * 0.55);
      ctx.lineTo(p.x + w * 0.45, p.y - h * 0.55);
      ctx.lineTo(p.x, p.y - h);
      ctx.fill();
    }
  }
}

function thing(ctx: Ctx, t: Thing, ahead: number, camera: number, time: number) {
  const p = project(t.lane, ahead, camera);
  const k = p.k;
  // A soft shadow under everything.
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.3;
  blob(ctx, p.x + 1.2 * k, p.y, 6 * k, 1.6 * k);
  ctx.globalAlpha = 1;
  if (t.kind === 'flake') {
    // A glowing snowflake, floating and turning gently.
    const bob = Math.sin(time / 500 + t.index) * 1.2 * k;
    const y = p.y - 8 * k + bob;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = colors.glow;
    blob(ctx, p.x, y, 8 * k, 8 * k);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colors.snow;
    ctx.lineWidth = Math.max(0.3, 1 * k);
    ctx.lineCap = 'round';
    const spin = time / 1_500 + t.index;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = spin + (i * Math.PI) / 3;
      ctx.moveTo(p.x - Math.cos(a) * 5 * k, y - Math.sin(a) * 5 * k);
      ctx.lineTo(p.x + Math.cos(a) * 5 * k, y + Math.sin(a) * 5 * k);
    }
    ctx.stroke();
  } else if (t.kind === 'rock') {
    ctx.fillStyle = colors.mountain;
    ctx.beginPath();
    ctx.moveTo(p.x - 7 * k, p.y);
    ctx.quadraticCurveTo(p.x - 6 * k, p.y - 11 * k, p.x - 1 * k, p.y - 12 * k);
    ctx.quadraticCurveTo(p.x + 6 * k, p.y - 10 * k, p.x + 7 * k, p.y);
    ctx.fill();
    ctx.fillStyle = colors.ice;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(p.x - 5 * k, p.y - 3 * k);
    ctx.quadraticCurveTo(p.x - 4.5 * k, p.y - 10 * k, p.x - 1 * k, p.y - 11 * k);
    ctx.quadraticCurveTo(p.x - 3 * k, p.y - 6 * k, p.x - 2 * k, p.y - 3 * k);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = colors.snowShade;
    blob(ctx, p.x, p.y - 3 * k, 8 * k, 5 * k);
    ctx.fillStyle = colors.snowLit;
    blob(ctx, p.x - 1.5 * k, p.y - 4.5 * k, 5 * k, 3 * k);
  }
}

/** The penguin from behind, on its belly on a little sled, tumbling softly after a crash. */
function penguin(ctx: Ctx, run: Run, time: number) {
  const camera = cameraLane(run.lane);
  const at = project(run.lane, 0, camera);
  const tumble = run.crashedAt === null ? 0 : Math.min(1, (time - run.crashedAt) / 700);
  const tilt = clamp((run.target - run.lane) * 0.4, -0.35, 0.35) + tumble * Math.PI * 0.55;
  const bounce =
    run.crashedAt === null ? Math.sin(time / 140) * 0.35 : -Math.sin(tumble * Math.PI) * 4;
  ctx.save();
  ctx.translate(at.x, 90 + bounce);
  ctx.rotate(tilt);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.3;
  blob(ctx, 1.5, 6, 15, 3);
  ctx.globalAlpha = 1;
  // The sled, with its curled runners.
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(-14, 3);
  ctx.lineTo(14, 3);
  ctx.lineTo(12, 7);
  ctx.lineTo(-12, 7);
  ctx.fill();
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, 8);
  ctx.lineTo(14, 8);
  ctx.stroke();
  // Flippers spread wide, then the round body, head and a little scarf.
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.ellipse(-10, 0, 7, 2.6, -0.35, 0, Math.PI * 2);
  ctx.ellipse(10, 0, 7, 2.6, 0.35, 0, Math.PI * 2);
  ctx.fill();
  blob(ctx, 0, -2, 8.5, 7.5);
  blob(ctx, 0, -10, 5.5, 5.2);
  ctx.fillStyle = colors.gold;
  blob(ctx, -3.5, 5, 2.4, 1.2);
  blob(ctx, 3.5, 5, 2.4, 1.2);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(-5.5, -6.2, 11, 2);
  ctx.fillRect(2, -6, 2, 5 + Math.sin(time / 200));
  ctx.restore();

  if (run.crashedAt !== null) {
    // A soft puff of snow where it tumbled.
    const puff = Math.min(1, (time - run.crashedAt) / 900);
    ctx.fillStyle = colors.snow;
    ctx.globalAlpha = 0.7 * (1 - puff);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      blob(ctx, at.x + Math.cos(a) * 14 * puff, 86 + Math.sin(a) * 6 * puff, 3, 2.2);
    }
    ctx.globalAlpha = 1;
  }
}

function label(ctx: Ctx, text: string, x: number, y: number, scale: number, width: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillText(text, 0, 0, width);
  ctx.restore();
}

function hud(ctx: Ctx, game: Game, pointer: SquarePointer | undefined, time: number) {
  ctx.fillStyle = colors.surface;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.roundRect(3, 3, 40, 9, 3);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.font = canvasFont('title', 'bold');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.glow;
  label(ctx, `★ ${game.run.score}`, 6, 7.8, 0.2, 80);
  ctx.fillStyle = colors.snow;
  label(ctx, `best ${game.best}`, 24, 7.8, 0.14, 120);

  const { crashedAt } = game.run;
  if (pointer && crashedAt !== null && time - crashedAt > TUMBLE) {
    ctx.fillStyle = colors.surface;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.roundRect(22, 44, 56, 13, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.glow;
    label(ctx, 'Oof! Tap to sled again', 50, 50.8, 0.16, 300);
  }
}

let game: Game | undefined;

/** First-person run down an ice mountain on a penguin's sled: steer round rocks and drifts, scoop up snowflakes. */
const booth: NorthPoleSquare = {
  id: 'hamzaoza',
  name: 'Penguin Slide',
  description:
    'Steer a little penguin down an ice mountain, round rocks and drifts, for snowflakes.',
  draw(ctx, size, time, pointer) {
    game = advance(game ?? newGame(time), time, pointer, size);
    const { run } = game;
    ctx.save();
    ctx.scale(size / 100, size / 100);
    ctx.beginPath();
    ctx.rect(0, 0, 100, 100);
    ctx.clip();
    const camera = cameraLane(run.lane);
    sky(ctx, time);
    slope(ctx, camera, run.distance);
    for (const { thing: t, ahead } of inView(run.seed, run.distance))
      thing(ctx, t, ahead, camera, time);

    // Snow whipping past the camera.
    ctx.fillStyle = colors.snow;
    for (let i = 0; i < 14; i++) {
      const f = drift(i, time);
      blob(ctx, f.x * 100, f.y * 100, 0.5, 0.5);
    }
    penguin(ctx, run, time);
    hud(ctx, game, pointer, time);
    ctx.restore();
  },
};

export default booth;
