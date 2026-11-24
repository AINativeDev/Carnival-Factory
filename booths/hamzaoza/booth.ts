import type { NorthPoleSquare } from '../../northpole/square';
import { canvasFont, theme } from '../../northpole/theme';

const { colors } = theme;

/** One whole run down the mountain, in milliseconds. */
export const LOOP = 24_000;

/** Things on the course: one every `SPACING` metres, `COURSE` metres round. */
export const SPACING = 10;
export const THINGS = 24;
export const COURSE = SPACING * THINGS;

/** How far ahead the sled can see, in metres. */
export const VIEW = 70;

/** Half the width of the track: lanes run from -1 to 1 with a margin of snow beyond. */
export const TRACK = 1.4;

/** Points for each snowflake scooped up. */
export const POINTS = 10;

export type Kind = 'flake' | 'rock' | 'drift';

export interface Thing {
  index: number;
  kind: Kind;
  /** Metres from the start of the run. */
  distance: number;
  /** Across the track, -1 left to 1 right. */
  lane: number;
}

/** Wraps `value` into [0, `span`), negative values included. */
function wrap(value: number, span: number) {
  return ((value % span) + span) % span;
}

/** How far down the course the sled is at `time`, in metres. */
export function distanceAt(time: number): number {
  return (wrap(time, LOOP) / LOOP) * COURSE;
}

/** The lane the penguin steers along: three slow weaves per run, so the run loops cleanly. */
export function pathAt(distance: number): number {
  return 0.55 * Math.sin((distance / COURSE) * Math.PI * 2 * 3);
}

/**
 * Thing `index` on the course. Snowflakes sit on the penguin's path and rocks and
 * snowdrifts sit to either side of it, so it glides round them every time.
 */
export function thingAt(index: number): Thing {
  const distance = (index + 0.5) * SPACING;
  const path = pathAt(distance);
  const side = index % 2 === 0 ? 1 : -1;
  switch (index % 3) {
    case 0:
      return { index, kind: 'flake', distance, lane: path };
    case 1:
      return { index, kind: 'rock', distance, lane: path + side * 0.75 };
    default:
      return { index, kind: 'drift', distance, lane: path - side * 0.75 };
  }
}

export const THING_LIST: readonly Thing[] = Array.from({ length: THINGS }, (_, i) => thingAt(i));

/** The snowflakes scooped up so far this run, times `POINTS`. */
export function scoreAt(time: number): number {
  const here = distanceAt(time);
  return THING_LIST.filter((t) => t.kind === 'flake' && t.distance <= here).length * POINTS;
}

/** The whole run's score, reached just before it loops. */
export const BEST = THING_LIST.filter((t) => t.kind === 'flake').length * POINTS;

/** Metres ahead of the sled that `thing` is, from 0 to `COURSE`. */
export function aheadOf(thing: Thing, time: number): number {
  return wrap(thing.distance - distanceAt(time), COURSE);
}

/** How big something `ahead` metres away looks: 1 at the sled, shrinking to the horizon. */
export function scaleAt(ahead: number): number {
  return 6 / (6 + ahead);
}

/** The things in view, furthest first, so nearer ones draw over them. */
export function inView(time: number): { thing: Thing; ahead: number }[] {
  return THING_LIST.map((thing) => ({ thing, ahead: aheadOf(thing, time) }))
    .filter(({ ahead }) => ahead > 0.6 && ahead < VIEW)
    .sort((a, b) => b.ahead - a.ahead);
}

/** How far the camera looks to the side: it follows the penguin, a little behind. */
export function cameraLane(time: number): number {
  return pathAt(distanceAt(time) - 3) * 0.9;
}

/** The little wobble of the sled's tilt, in radians. */
export function lean(time: number): number {
  const d = distanceAt(time);
  return (pathAt(d + 2) - pathAt(d - 2)) * 0.6;
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

/** The penguin from behind, on its belly on a little sled. */
function penguin(ctx: Ctx, time: number) {
  const tilt = lean(time);
  const bounce = Math.sin(time / 140) * 0.35;
  ctx.save();
  ctx.translate(50 + tilt * 40, 90 + bounce);
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
}

function hud(ctx: Ctx, time: number) {
  ctx.fillStyle = colors.surface;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.roundRect(3, 3, 30, 9, 3);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.glow;
  ctx.font = canvasFont('title', 'bold');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(6, 7.8);
  ctx.scale(0.2, 0.2);
  ctx.fillText(`★ ${scoreAt(time)}`, 0, 0, 120);
  ctx.restore();
}

/** First-person run down an ice mountain, on a penguin's sled, scooping up snowflakes. */
const booth: NorthPoleSquare = {
  id: 'hamzaoza',
  name: 'Penguin Slide',
  description: 'Sled down an ice mountain behind a little penguin, round rocks and drifts.',
  draw(ctx, size, time) {
    ctx.save();
    ctx.scale(size / 100, size / 100);
    ctx.beginPath();
    ctx.rect(0, 0, 100, 100);
    ctx.clip();
    const camera = cameraLane(time);
    const here = distanceAt(time);
    sky(ctx, time);
    slope(ctx, camera, here);
    for (const { thing: t, ahead } of inView(time)) thing(ctx, t, ahead, camera, time);

    // Snow whipping past the camera.
    ctx.fillStyle = colors.snow;
    for (let i = 0; i < 14; i++) {
      const f = drift(i, time);
      blob(ctx, f.x * 100, f.y * 100, 0.5, 0.5);
    }
    penguin(ctx, time);
    hud(ctx, time);
    ctx.restore();
  },
};

export default booth;
