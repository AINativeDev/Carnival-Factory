/**
 * The elves of Boarding Time, in the square's 0 to 100 units: the queue on the
 * boarding deck, the elf hopping into a car, riders hopping off and walking
 * away, and the elves who missed, sulking on the snow under a little cloud.
 */
import { box, iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { ease, type Spot } from './ride';

const { colors } = theme;

/** Where the elves stand in line, the front one first, along the boarding deck. */
const QUEUE: readonly Spot[] = [0, 1, 2, 3, 4, 5].map((n) => iso(9 - n * 6, 18, 1.2));
/** Where riders hop down to, and where they walk off to, past the wheel's foot. */
const OFF: readonly Spot[] = [iso(14, 10), iso(13, -12)];
/** Where the elves who missed sit and sulk, the first one nearest the gate. */
const SULK: readonly Spot[] = [iso(20, 4), iso(20, -1), iso(20, -6)];
/** The scarves the elves in the queue wear, so each one is somebody. */
const SCARVES = [colors.mint, colors.gold, colors.violet, colors.aurora, colors.ice];
/** How long an elf takes to hop into a car, and to walk off to sulk, in milliseconds. */
export const HOP_IN = 320;
const TO_SULK = 700;

/** An elf's pointed hat over a head at (x, y): its tip perky, or drooping when the elf sulks. */
function hat(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, droop: boolean) {
  const tip = droop ? { x: x - 3.4, y: y + 0.8 } : { x: x + 2.2, y: y - 3.8 };
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 1.9, y - 0.6);
  ctx.quadraticCurveTo(x + (droop ? 0.6 : -0.4), y - 4.4, tip.x, tip.y);
  ctx.quadraticCurveTo(x + 1.2, y - 2.6, x + 1.9, y - 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 2, y - 1, 4, 0.9);
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 0.75, 0, Math.PI * 2);
  ctx.fill();
}

/** A head at (x, y) with a hat: berry for the visitor's elves, violet for guests. */
function head(ctx: CanvasRenderingContext2D, x: number, y: number, guest: boolean, droop = false) {
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x, y, 1.6, 0, Math.PI * 2);
  ctx.fill();
  hat(ctx, x, y - 0.6, guest ? colors.violet : colors.berry, droop);
}

/** A rider's head over a car's rim at `lip`, bobbing gently, a guest waving. */
export function elfHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  lip: number,
  guest: boolean,
  time: number,
) {
  const bob = Math.sin(time / 600) * 0.3;
  head(ctx, x, lip - 1 + bob, guest);
  if (!guest) return;
  ctx.strokeStyle = colors.glow;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x + 1.6, lip - 0.2);
  ctx.lineTo(x + 3.2 + Math.sin(time / 300) * 0.6, lip - 3.4);
  ctx.stroke();
}

/** A whole elf standing on (x, y) in a scarf, `guest` in a violet hat. */
function elf(ctx: CanvasRenderingContext2D, x: number, y: number, scarf: string, guest = false) {
  shadow(ctx, x, y, 4.5);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(x - 1.3, y - 1.6, 1, 1.6);
  ctx.fillRect(x + 0.3, y - 1.6, 1, 1.6);
  ctx.fillStyle = colors.pine;
  ctx.fillRect(x - 1.8, y - 5.4, 3.6, 4);
  ctx.fillStyle = colors.pineDark;
  ctx.fillRect(x + 0.4, y - 5.4, 1.4, 4);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 1.8, y - 2.6, 3.6, 0.6);
  ctx.fillStyle = scarf;
  ctx.fillRect(x - 2, y - 5.8, 4, 1);
  head(ctx, x, y - 7.2, guest);
}

/** An elf who missed, sitting on (x, y), arms crossed and hat drooping, with a grey cloud while `cloud` lasts. */
function sulker(ctx: CanvasRenderingContext2D, x: number, y: number, cloud: number, time: number) {
  shadow(ctx, x, y, 5);
  ctx.fillStyle = colors.pine;
  ctx.fillRect(x - 2, y - 3.4, 4, 3.4);
  ctx.fillStyle = colors.pineDark;
  ctx.fillRect(x - 2, y - 2.2, 4, 0.8);
  head(ctx, x, y - 5, false, true);
  if (cloud <= 0) return;
  ctx.globalAlpha = cloud;
  ctx.fillStyle = colors.mountain;
  const drift = Math.sin(time / 700) * 0.6;
  for (const [dx, r] of [
    [-1.6, 1.4],
    [0.4, 1.9],
    [2.2, 1.3],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + dx + drift, y - 11, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = colors.ice;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (const dx of [-1.4, 0.4, 2.2]) {
    const fall = ((time / 400 + dx) % 1) * 1.5;
    ctx.moveTo(x + dx + drift, y - 9.4 + fall);
    ctx.lineTo(x + dx + drift - 0.3, y - 8.6 + fall);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** A point `p` of the way from `a` to `b`, `lift` higher in the middle, as a hop goes. */
function hop(a: Spot, b: Spot, p: number, lift: number): Spot {
  return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p - Math.sin(p * Math.PI) * lift };
}

/** The boarding deck along the wheel's foot, with its rope line of gold posts. */
export function deck(ctx: CanvasRenderingContext2D) {
  box(ctx, -18, 15, 32, 6, 1.2, colors.cream, colors.wood, colors.cocoa);
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let n = 0; n <= 4; n++) {
    const post = iso(-16 + n * 7, 21, 1.2);
    ctx.fillStyle = colors.gold;
    ctx.fillRect(post.x - 0.4, post.y - 4, 0.8, 4);
    if (n === 0) ctx.moveTo(post.x, post.y - 3.4);
    else ctx.quadraticCurveTo(post.x - 3.5, post.y - 1.6, post.x, post.y - 3.4);
  }
  ctx.stroke();
}

/** What the elves show: the last boarding and miss, the elves served, the sulkers and the riders hopping off. */
export interface Crowd {
  boardedAt: number;
  missedAt: number;
  served: number;
  misses: number;
  hops: readonly { at: number; guest: boolean }[];
}

/** The queue, shuffling forward after each elf leaves it, and the elf hopping into `car` at the gate. */
export function queue(ctx: CanvasRenderingContext2D, crowd: Crowd, car: Spot, time: number) {
  const left = Math.max(crowd.boardedAt, crowd.missedAt);
  const step = ease((time - left) / 450);
  for (let n = QUEUE.length - 2; n >= 0; n--) {
    const from = QUEUE.at(n + 1) ?? car;
    const to = QUEUE.at(n) ?? car;
    const at = hop(from, to, step, step < 1 ? 0.8 : 0);
    elf(ctx, at.x, at.y, SCARVES.at((crowd.served + n) % SCARVES.length) ?? colors.mint);
  }
  const into = (time - crowd.boardedAt) / HOP_IN;
  const front = QUEUE.at(0) ?? car;
  if (into >= 0 && into < 1) {
    const at = hop(front, { x: car.x, y: car.y + 1 }, into, 6);
    elf(ctx, at.x, at.y, SCARVES.at((crowd.served - 1) % SCARVES.length) ?? colors.mint);
  }
}

/** Riders hopping off at the gate and walking away, and the elves who missed, sulking. */
export function offTheRide(ctx: CanvasRenderingContext2D, crowd: Crowd, gate: Spot, time: number) {
  const [down = gate, away = gate] = OFF;
  for (const { at, guest } of crowd.hops) {
    const p = (time - at) / 1_600;
    if (p < 0 || p >= 1) continue;
    const spot = p < 0.25 ? hop(gate, down, p / 0.25, 3) : hop(down, away, (p - 0.25) / 0.75, 0);
    ctx.globalAlpha = Math.min(1, (1 - p) * 4);
    elf(ctx, spot.x, spot.y, colors.snow, guest);
    ctx.globalAlpha = 1;
  }
  const front = QUEUE.at(0) ?? gate;
  SULK.slice(0, crowd.misses).forEach((seat, n) => {
    const newest = n === crowd.misses - 1;
    const walk = newest ? (time - crowd.missedAt) / TO_SULK : 1;
    const cloud = newest ? Math.min(1, Math.max(0, 3 - (time - crowd.missedAt) / 1_000)) : 0;
    if (walk < 1) {
      const at = hop(front, seat, Math.max(0, walk), 1.5);
      elf(ctx, at.x, at.y, colors.snowShade);
    } else sulker(ctx, seat.x, seat.y, cloud, time);
  });
}
