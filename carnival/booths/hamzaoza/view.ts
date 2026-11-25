/**
 * The view from just behind the sled: how far ahead it sees, how things shrink
 * towards the horizon and where they stand on the drawing. Everything draws on
 * a 100 by 100 square, which the booth scales to its size.
 */
import { type Thing, thingsBetween, wrap } from './course';

/** The drawing context every part of the scene paints on. */
export type Ctx = CanvasRenderingContext2D;

/** How far ahead the sled can see, in metres. */
export const VIEW = 70;

/** Where the sky meets the slope, down the 100-high drawing. */
export const HORIZON = 36;
/** Where the sled sits on the slope, down the 100-high drawing. */
const GROUND = 92;

/** How big something `ahead` metres away looks: 1 at the sled, shrinking to the horizon. */
export function scaleAt(ahead: number): number {
  return 6 / (6 + ahead);
}

/** The things in view `distance` metres down a run, furthest first, so nearer ones draw over them. */
export function inView(seed: number, distance: number): { item: Thing; ahead: number }[] {
  return thingsBetween(seed, distance + 0.6, distance + VIEW)
    .map((item) => ({ item, ahead: item.distance - distance }))
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

/** Where something `ahead` metres away at `lane` stands on the screen. */
export function project(lane: number, ahead: number, camera: number) {
  const k = scaleAt(ahead);
  return {
    k,
    x: 50 + (lane - camera) * 36 * k,
    y: HORIZON + (GROUND - HORIZON) * k,
  };
}

/** A filled ellipse: the soft, rounded shape most of the scene is made of. */
export function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
