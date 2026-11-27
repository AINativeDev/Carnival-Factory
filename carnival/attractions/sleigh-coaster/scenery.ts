/**
 * The coaster's long snowy hill as it scrolls by: the track seen side on,
 * running left to right across the diorama with a little depth, its candy-cane
 * near rail and shaded far rail on wooden trestles, the hill's slopes lit
 * where they face the light, and the station the sleigh leaves from.
 */
import { theme } from '../../../src/northpole/theme';
import { heightAt, trackAt } from './track';

const { colors } = theme;

/** Screen units to a metre along the track. */
const SCALE = 0.8;
/** Screen units to a metre up: the hills drawn taller than they ride, so their crests read on the map. */
const TALL = 1.35;
/** Where the camera's left edge is on screen. */
const LEFT = 2;
/** Where the ground under the middle of the track is on screen. */
const GROUND = 80;
/** How high the rail stands on its trestles over a valley, in screen units. */
const RAIL = 4;
/** How far below the rail the hill's snow lies, in screen units. */
const UNDER = 7;
/** The near and far rails, across the track. */
export const NEAR = 3;
const FAR = -3;
/** How much track the camera shows, in metres. */
const VIEW = 125;

/** The camera's left edge when the sleigh is at `x`: the sleigh rides a third of the way in. */
export const camOf = (x: number) => x - 34;

/** Where a point `y` metres up at `x` along the track is on screen, `across` it and `drop` below. */
export function onScreen(x: number, y: number, cam: number, across = 0, drop = 0) {
  const z = Math.max(0, y * TALL + RAIL - drop);
  return { x: LEFT + (x - cam) * SCALE, y: GROUND + across - z };
}

/** A point on the rail at `x`, `across` it and `drop` below it. */
const railAt = (x: number, cam: number, across: number, drop = 0) =>
  onScreen(x, heightAt(x), cam, across, drop);

/** The hill under the track: its snowy top lit where it rises, and its near side down to the ground. */
function hill(ctx: CanvasRenderingContext2D, from: number, to: number, cam: number) {
  for (let x = from; x < to; x += 2) {
    ctx.fillStyle = trackAt(x + 1).slope > 0 ? colors.snowLit : colors.snowShade;
    const corners = [
      railAt(x, cam, NEAR + 3, UNDER),
      railAt(x + 2.2, cam, NEAR + 3, UNDER),
      railAt(x + 2.2, cam, FAR - 3, UNDER),
      railAt(x, cam, FAR - 3, UNDER),
    ];
    ctx.beginPath();
    for (const p of corners) ctx.lineTo(p.x, p.y);
    ctx.fill();
  }
  ctx.fillStyle = colors.slab;
  ctx.beginPath();
  for (let x = from; x <= to; x += 2) {
    const p = railAt(x, cam, NEAR + 3, UNDER);
    if (x === from) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  for (const x of [to, from]) {
    const p = onScreen(x, 0, cam, NEAR + 3, 99);
    ctx.lineTo(p.x, p.y);
  }
  ctx.fill();
}

/** The rail along `across`, as one line. */
function rail(
  ctx: CanvasRenderingContext2D,
  from: number,
  to: number,
  cam: number,
  across: number,
) {
  ctx.beginPath();
  for (let x = from; x <= to; x += 1) {
    const p = railAt(x, cam, across);
    if (x === from) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

/** The near rail in candy-cane stripes that stay put on the track as it scrolls. */
function candyCane(ctx: CanvasRenderingContext2D, from: number, to: number, cam: number) {
  ctx.lineWidth = 1.6;
  for (const [colour, odd] of [
    [colors.snow, 0],
    [colors.berry, 1],
  ] as const) {
    ctx.strokeStyle = colour;
    ctx.beginPath();
    for (let x = from; x < to; x += 1.5) {
      if (Math.round(x / 1.5) % 2 !== odd) continue;
      const a = railAt(x, cam, NEAR);
      const b = railAt(x + 1.5, cam, NEAR);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
  }
}

/** The station by the start: a wooden platform with a snowy roof, and its launch lever. */
function station(ctx: CanvasRenderingContext2D, cam: number, waiting: boolean) {
  const left = onScreen(-16, 0, cam, NEAR + 4, RAIL);
  const right = onScreen(8, 0, cam, NEAR + 4, RAIL);
  if (right.x < 0) return;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(left.x, left.y - 3.5, right.x - left.x, 3.5);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(left.x, left.y - 0.6, right.x - left.x, 0.6);
  for (const post of [left.x + 1, right.x - 2]) ctx.fillRect(post, left.y - 17, 1, 14);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(left.x - 1, left.y - 19, right.x - left.x + 2, 2.4);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(left.x - 1.5, left.y - 20, right.x - left.x + 3, 1.2);
  const lever = { x: right.x - 5, y: left.y - 3.5 };
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(lever.x, lever.y);
  ctx.lineTo(lever.x + (waiting ? -2 : 2), lever.y - 5);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.arc(lever.x + (waiting ? -2 : 2), lever.y - 5, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

/** The scrolling coaster with the camera's left edge at `cam`, back to front. */
export function drawScenery(ctx: CanvasRenderingContext2D, cam: number, waiting: boolean) {
  const from = Math.floor(cam / 2) * 2 - 2;
  const to = from + VIEW + 4;
  hill(ctx, from, to, cam);
  // The trestles, every 8 metres along the track, near and far.
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let x = Math.ceil(from / 8) * 8; x < to; x += 8) {
    for (const across of [FAR, NEAR]) {
      const a = railAt(x, cam, across);
      const b = railAt(x, cam, across, UNDER);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
  }
  ctx.stroke();
  ctx.strokeStyle = colors.shadow;
  ctx.lineWidth = 0.9;
  rail(ctx, from, to, cam, FAR);
  // The ties between the rails, every 4 metres.
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let x = Math.ceil(from / 4) * 4; x < to; x += 4) {
    const a = railAt(x, cam, FAR);
    const b = railAt(x, cam, NEAR);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();
  candyCane(ctx, from, to, cam);
  station(ctx, cam, waiting);
}
