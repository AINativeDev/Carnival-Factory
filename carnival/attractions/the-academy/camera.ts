/**
 * Where the camera looks in the hall, and where the ticket stands, as plain
 * functions of the visit and how long its beat has been up. Each station is
 * one bay of the hall, a screen wide; on a new step the camera slides from
 * the bay the visitor came from to the next, and the ticket hops along with
 * it, so the stations feel like places the ticket travels between.
 */
import { popIn, smooth } from './kit';
import type { Visit } from './state';
import { STEPS, type StepKind } from './steps';

/** How many bays the hall has: the entrance, then a bay for each of the seven stations. */
export const BAYS = 8;
/** How long the camera takes to slide from one bay to the next, in ms. */
export const PAN = 900;

/** The bay a step of kind `kind` stands in. */
export function bayOf(kind: StepKind): number {
  switch (kind) {
    case 'start':
      return 0;
    case 'booth':
    case 'look':
    case 'ticket':
      return 1;
    case 'assess':
      return 2;
    case 'build':
      return 3;
    case 'checks':
      return 4;
    case 'review':
      return 5;
    case 'gate':
      return 6;
    case 'live':
    case 'repo':
      return 7;
  }
}

/** The kind of step `step`, or the first screen's for none. */
const kindAt = (step: number): StepKind => STEPS.at(step)?.kind ?? 'start';

/** How far the walk from the last step has come, 0 to 1, `since` ms into the beat. */
const walked = (since: number) => smooth(since / PAN);

/** How far along the hall the camera is, in the square's units, `since` ms into the visit's beat. */
export function cameraAt(visit: Visit, since: number): number {
  const from = bayOf(kindAt(visit.from));
  const to = bayOf(kindAt(visit.step));
  return (from + (to - from) * walked(since)) * 100;
}

/** Where the ticket stands: its middle, how wide it is, and the floor its shadow falls on. */
export interface Spot {
  x: number;
  y: number;
  s: number;
  ground: number;
}

/** Where the ticket stands at a step of kind `kind`, or undefined while it isn't on show. */
export function spotOf(kind: StepKind): Spot | undefined {
  switch (kind) {
    case 'start':
      return { x: 50, y: 46, s: 34, ground: 66 };
    case 'booth':
    case 'look':
    case 'repo':
      return undefined;
    case 'ticket':
      return { x: 52, y: 42, s: 32, ground: 57.5 };
    case 'live':
      return { x: 16, y: 40, s: 23, ground: 60 };
    default:
      return { x: 25, y: 51, s: 23, ground: 73 };
  }
}

/** The ticket on its way: where it is, and how big it has popped in (1 there). */
export interface Walk extends Spot {
  grow: number;
}

/**
 * Where the ticket is `since` ms into the visit's beat: hopping from where
 * it stood at the last step to this one's spot, or popping in where it had
 * no spot before; undefined while it isn't on show.
 */
export function ticketAt(visit: Visit, since: number): Walk | undefined {
  const to = spotOf(kindAt(visit.step));
  if (!to) return undefined;
  const from = visit.from === visit.step ? to : spotOf(kindAt(visit.from));
  if (!from) {
    // Across bays it waits for the camera to arrive; in the same bay it pops straight in.
    const moved = bayOf(kindAt(visit.from)) !== bayOf(kindAt(visit.step));
    return { ...to, grow: popIn((since - (moved ? PAN / 2 : 0)) / 450) };
  }
  const t = walked(since);
  const hop = Math.abs(Math.sin(t * Math.PI * 2)) * 5 * (1 - t);
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t - hop,
    s: from.s + (to.s - from.s) * t,
    ground: from.ground + (to.ground - from.ground) * t,
    grow: 1,
  };
}
