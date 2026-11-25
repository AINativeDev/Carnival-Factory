/**
 * When everything in the depot happens. The whole scene runs on one 8-second
 * round, and every movement is a plain function of where we are in it, so the
 * drawing keeps no state between frames and the timing can be tested alone.
 */

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

/** How many times Santa waves each round. */
const WAVES = 2;

/** Santa's waving arm, in radians up from his side: he waves for the first half of the round, the arm rising and settling smoothly. */
export function waveAngle(t: number) {
  if (t >= 0.5) return 0;
  const raise = ease(t / 0.08) * ease((0.5 - t) / 0.08);
  return raise * (2.1 + 0.4 * Math.sin((t / 0.5) * WAVES * Math.PI * 2 - Math.PI / 2));
}

/** How many parcels sit on the stack while no elf has taken one. */
export const STACK_SIZE = 3;
/** When the carrying elf lifts the top parcel off the stack. */
const PICKUP = 0.12;
/** When a new parcel starts dropping onto the stack, to replace the one taken. */
const DROP_START = 0.7;
/** When the new parcel lands, and the stack is whole again. */
const DROP_END = 0.82;

/** The stack's parcels: how many sit on it, and how far through its fall a new one is, so the stack goes down by one and fills again each round. */
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

/** One snowflake's place and size on the 100 by 100 scene. */
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
