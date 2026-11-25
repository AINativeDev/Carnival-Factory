/**
 * A level's roller coaster as a ride: the `coaster` and `coaster-loop` props
 * it's laid from, ridden by one golden ticket in the order the level lists
 * them. Each piece learns where the ticket comes onto it and leaves it, and
 * when, so the map draws the ticket on whichever piece it's riding at its
 * depth, and the ride stays plain data (ADR 0035). Plain functions, so the
 * tests check the ride the way the map draws it.
 */
import { phase } from './elf';
import type { LevelProp } from './level';
import { toScreen, type Thing, type Tile } from './world';

/** How long the ticket takes over a tile of straight track, and round a loop, in milliseconds. */
export const STRAIGHT_TIME = 400;
export const LOOP_TIME = 1800;
/** How high the rail runs over the snow, and a loop's radius, in pixels. */
export const RAIL = 24;
export const LOOP_SIZE = 26;
/** How much of a loop's time the ticket spends on the rail either side of it. */
const RUN_IN = 0.15;

/** One piece's part of the ride. */
export interface CoasterLeg {
  /** Where the ticket comes onto the piece and leaves it, halfway to the pieces either side, in tiles. */
  enter: Tile;
  leave: Tile;
  /** When the ticket comes on and leaves, in milliseconds into the ride. */
  from: number;
  to: number;
  /** How long the whole ride takes, from the first piece to the last. */
  ride: number;
}

/** Where the ticket is on screen, and which way it faces along the rail, in radians. */
interface Ticket extends Tile {
  angle: number;
}

const isPiece = (kind: string) => kind === 'coaster' || kind === 'coaster-loop';
const timeOn = (kind: string) => (kind === 'coaster-loop' ? LOOP_TIME : STRAIGHT_TIME);

/** Where the ticket comes on and goes off: halfway to each neighbour, or half a tile on at either end of the ride. */
function ends(before: Tile | undefined, here: Tile, after: Tile | undefined) {
  const half = (a: Tile, b: Tile) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const away = (other: Tile) => ({ x: (3 * here.x - other.x) / 2, y: (3 * here.y - other.y) / 2 });
  const westward = { x: here.x - 0.5, y: here.y };
  const eastward = { x: here.x + 0.5, y: here.y };
  return {
    enter: before ? half(before, here) : after ? away(after) : westward,
    leave: after ? half(here, after) : before ? away(before) : eastward,
  };
}

/** The level's things with every coaster piece given its leg of the ride, in the order they're listed. */
export function rideCoaster(things: readonly Thing[]): Thing[] {
  const pieces = things.filter((thing) => isPiece(thing.kind));
  const ride = pieces.reduce((sum, piece) => sum + timeOn(piece.kind), 0);
  const legs = new Map<Thing, CoasterLeg>();
  let from = 0;
  pieces.forEach((piece, n) => {
    const to = from + timeOn(piece.kind);
    const before = n > 0 ? pieces.at(n - 1) : undefined;
    legs.set(piece, { ...ends(before, piece, pieces.at(n + 1)), from, to, ride });
    from = to;
  });
  return things.map((thing) => {
    const leg = legs.get(thing);
    return leg ? { ...thing, ride: leg } : thing;
  });
}

/** A piece's leg, or, for a piece on its own, a ride of one from west to east. */
export const legOf = (piece: Thing): CoasterLeg =>
  piece.ride ?? {
    ...ends(undefined, piece, undefined),
    from: 0,
    to: timeOn(piece.kind),
    ride: timeOn(piece.kind),
  };

/** Where the rail is on screen over a point of the ground, in tiles. */
export const railAt = (at: Tile): Tile => {
  const { x, y } = toScreen(at);
  return { x, y: y - RAIL };
};

/** Which way a loop's piece runs on screen, as a step of one pixel. */
export function loopHeading(piece: Thing): Tile {
  const { enter, leave } = legOf(piece);
  const a = toScreen(enter);
  const b = toScreen(leave);
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
}

/** A point round a loop, `turn` radians from its foot: up and forward, over the top, and down behind. */
export function loopPoint(foot: Tile, heading: Tile, turn: number): Ticket {
  const forward = Math.sin(turn) * LOOP_SIZE;
  return {
    x: foot.x + heading.x * forward,
    y: foot.y + heading.y * forward - (1 - Math.cos(turn)) * LOOP_SIZE,
    angle: Math.atan2(heading.y * Math.cos(turn) - Math.sin(turn), heading.x * Math.cos(turn)),
  };
}

/** A point `f` of the way from `a` to `b`, facing along it. */
const along = (a: Tile, b: Tile, f: number): Ticket => ({
  x: a.x + (b.x - a.x) * f,
  y: a.y + (b.y - a.y) * f,
  angle: Math.atan2(b.y - a.y, b.x - a.x),
});

/** Where the ticket is on a piece at `time`, or undefined while it's riding another. */
export function ticketAt(piece: Thing, time: number): Ticket | undefined {
  const leg = legOf(piece);
  const at = phase(time, leg.ride, 0) * leg.ride;
  if (at < leg.from || at >= leg.to) return undefined;
  const f = (at - leg.from) / (leg.to - leg.from);
  const enter = railAt(leg.enter);
  const middle = railAt(piece);
  const leave = railAt(leg.leave);
  if (piece.kind !== 'coaster-loop')
    return f < 0.5 ? along(enter, middle, f * 2) : along(middle, leave, f * 2 - 1);
  if (f < RUN_IN) return along(enter, middle, f / RUN_IN);
  if (f >= 1 - RUN_IN) return along(middle, leave, (f - 1 + RUN_IN) / RUN_IN);
  const turn = ((f - RUN_IN) / (1 - 2 * RUN_IN)) * Math.PI * 2;
  return loopPoint(middle, loopHeading(piece), turn);
}

/**
 * What's wrong with a level's coaster: each piece must join the one listed
 * before it, side by side, and a loop must stand on a straight run, so the
 * ticket goes in one side and out the other.
 */
export function rideProblems(props: readonly LevelProp[]): string[] {
  const pieces = props.flatMap((prop, n) => (isPiece(prop.kind) ? [{ ...prop, n }] : []));
  const problems: string[] = [];
  pieces.forEach((piece, i) => {
    const before = i > 0 ? pieces.at(i - 1) : undefined;
    const after = pieces.at(i + 1);
    if (before && Math.abs(before.x - piece.x) + Math.abs(before.y - piece.y) !== 1)
      problems.push(
        `prop ${piece.n}, a ${piece.kind}, doesn't join prop ${before.n}, the coaster piece before it`,
      );
    if (piece.kind === 'coaster-loop' && before && after)
      if (before.x !== after.x && before.y !== after.y)
        problems.push(`prop ${piece.n}, a coaster-loop, must stand on a straight run of track`);
  });
  return problems;
}
