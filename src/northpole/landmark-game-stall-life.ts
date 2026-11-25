/**
 * The life round Snowball Toss's game stall on the map, so it reads as a game
 * someone is playing: an elf at the front throwing, winding up as each
 * snowball is due and following through as it flies, two more queueing with
 * their tickets, a pennant waving on each front post, candy-cane prizes
 * swaying from the header and a warm lamp glowing over the targets. Every
 * motion is a slow swing: nothing here flashes (ADR 0042).
 */
import { glow } from './brushes';
import { elf, outfit, swing } from './elf';
import { pennant, spot } from './landmark-kit';
import { theme } from './theme';
import type { Plot, Tile } from './world';

const { colors } = theme;

/** Where the thrower stands: at the front, right of the counter, so the drawing on it stays clear. */
export const THROWER = { along: 0.97, deep: 0.06 };

/** How far above the thrower's hand the snowball it holds sits. */
const HELD = 2;

/**
 * How the thrower's throwing arm is, through one throw `t` from 0 (just let
 * go) to 1 (about to): flung forward and up as the snowball leaves, then
 * drawn slowly back over the shoulder for the next.
 */
export function throwingArm(t: number): Tile {
  const back = t < 0.2 ? 1 - t / 0.2 : (t - 0.2) / 0.8;
  return { x: -8 + back * 14, y: -12 + back * 6 };
}

/**
 * Where the snowball leaves from, given the thrower's feet: the ball held in
 * its hand as the throw comes round, so it flies on from there without a
 * jump. The hand hangs off the right shoulder, which `elf` puts 5 right of and
 * 24 above the feet.
 */
export function releaseFrom(feet: Tile): Tile {
  const arm = throwingArm(0);
  return { x: feet.x + 5 + arm.x, y: feet.y - 24 + arm.y - HELD };
}

/** The lamp under the hood and the candy canes on the header, at the plot's `top`. */
export function hoodLights(ctx: CanvasRenderingContext2D, plot: Plot, top: number, time: number) {
  const lamp = spot(plot, 0.5, 0.6, top - 24);
  glow(ctx, lamp.x, lamp.y + 30, 70, 0.9);
  ctx.fillStyle = colors.lantern;
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y, 3, 0, Math.PI * 2);
  ctx.fill();
  // Candy-cane prizes hung under the header, each swaying on its own.
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 3;
  for (const [n, along] of [0.24, 0.42, 0.6, 0.78].entries()) {
    const hook = spot(plot, along, 0.07, 140);
    const sway = (swing(time, 3200, n * 0.3) - 0.5) * 4;
    ctx.beginPath();
    ctx.arc(hook.x - 3, hook.y, 3, Math.PI, 0);
    ctx.lineTo(hook.x + sway, hook.y + 16);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

/** A ticket held up in an elf's hand. */
function ticket(ctx: CanvasRenderingContext2D, hand: Tile) {
  ctx.fillStyle = colors.gold;
  ctx.fillRect(hand.x - 3, hand.y - 6, 7, 5);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(hand.x - 1, hand.y - 6, 1.5, 5);
}

/**
 * What stands in front of the counter: the pennants on the posts, the queue
 * at the left with tickets, and the thrower at the right, `t` through its
 * throw. Drawn after the counter, back to front.
 */
export function stallLife(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  stage: number,
  posts: number,
  time: number,
  t: number,
) {
  pennant(ctx, spot(plot, 0.085, 0.07, stage + posts), 26, colors.pine, time);
  pennant(ctx, spot(plot, 0.915, 0.07, stage + posts), 26, colors.berry, time);
  for (const [n, deep] of [0.34, 0.12].entries()) {
    const feet = spot(plot, 0.02, deep, stage);
    // Shuffling from foot to foot while they wait.
    const shuffle = (swing(time, 2600, n * 0.5) - 0.5) * 2;
    const look = outfit(n ? 0.6 : 0.1);
    const hands = elf(ctx, feet.x + shuffle, feet.y, {
      ...look,
      left: { x: -2, y: 14 },
      right: { x: 3, y: -6 + shuffle },
    });
    ticket(ctx, hands.right);
  }
  const feet = spot(plot, THROWER.along, THROWER.deep, stage);
  const hands = elf(ctx, feet.x, feet.y, {
    ...outfit(0.3),
    left: { x: -6, y: 4 },
    right: throwingArm(t),
  });
  // A snowball in its hand while it winds up for the next throw.
  if (t > 0.25) {
    ctx.fillStyle = colors.snow;
    ctx.beginPath();
    ctx.arc(hands.right.x, hands.right.y - HELD, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
