/**
 * Riding a ride level's coaster (ADR 0041): the visitor sits in the golden
 * ticket car, which runs round the track at its own calm pace and stops at
 * each `coaster-station`, in the order the track reaches them, until the
 * visitor asks it to ride on. The track is a circuit, so after the last
 * station the car comes round to the first again, the boarding station by the
 * sleigh home. Plain functions over plain values, so the tests ride it the
 * way the map does.
 */
import { legOf } from './coaster-ride';
import { isTrack } from './coaster-pieces';
import type { Thing, Tile } from './world';

/** Where the car is on its ride. */
export interface Ride {
  /** The track's pieces, in the order the car rides them. */
  readonly track: readonly Thing[];
  /** How long a whole lap takes, in milliseconds. */
  readonly lap: number;
  /** When the car is over each station's middle, in milliseconds into a lap. */
  readonly stops: readonly number[];
  /** How far into the lap the car is now, in milliseconds. */
  at: number;
  /** The station the car stands at, or is riding to next. */
  stop: number;
  /** How much longer it rides before it gets there, in milliseconds: none while it stands there. */
  ahead: number;
}

/** When the car is over a piece's middle, in milliseconds into the lap. */
const middleOf = (piece: Thing) => {
  const leg = legOf(piece);
  return (leg.from + leg.to) / 2;
};

/** A ride on a level's things, standing at its first station, or undefined when it has no stations. */
export function startRide(things: readonly Thing[]): Ride | undefined {
  const track = things.filter((thing) => isTrack(thing.kind));
  const stops = track.filter((piece) => piece.kind === 'coaster-station').map(middleOf);
  const first = stops.at(0);
  const piece = track.at(0);
  if (first === undefined || !piece) return undefined;
  return { track, lap: legOf(piece).ride, stops, at: first, stop: 0, ahead: 0 };
}

/** Whether the car stands at a station, waiting to ride on. */
export const waiting = (ride: Ride) => ride.ahead <= 0;

/** The car `ms` milliseconds on, stopping when it reaches the station it's riding to. */
export function rideFor(ride: Ride, ms: number): Ride {
  const step = Math.min(Math.max(0, ms), ride.ahead);
  return { ...ride, at: (ride.at + step) % ride.lap, ahead: ride.ahead - step };
}

/** The car leaving its station for the next one round the track, or, with `jump`, there at once. */
export function rideOn(ride: Ride, jump = false): Ride {
  const stop = (ride.stop + 1) % ride.stops.length;
  const there = ride.stops.at(stop);
  if (there === undefined) return ride;
  // Round the circuit: a lap's worth when the only station is the one it's leaving.
  const ahead = (there - ride.at + ride.lap) % ride.lap || ride.lap;
  return jump ? { ...ride, stop, at: there, ahead: 0 } : { ...ride, stop, ahead };
}

/** The car standing at station `n`. */
export function standAt(ride: Ride, n: number): Ride {
  const there = ride.stops.at(n);
  return there === undefined ? ride : { ...ride, stop: n, at: there, ahead: 0 };
}

/** The piece the car is on now. */
export function pieceUnder(ride: Ride): Thing | undefined {
  return ride.track.find((piece) => {
    const leg = legOf(piece);
    return ride.at >= leg.from && ride.at < leg.to;
  });
}

/** Where on the ground the car is, in tiles: along the piece it's on, from where it came on to where it leaves. */
export function carAt(ride: Ride): Tile {
  const piece = pieceUnder(ride);
  if (!piece) return { x: 0, y: 0 };
  const { enter, leave, from, to } = legOf(piece);
  const f = (ride.at - from) / (to - from);
  const [a, b, g] = f < 0.5 ? [enter, piece, f * 2] : [piece, leave, f * 2 - 1];
  return { x: a.x + (b.x - a.x) * g, y: a.y + (b.y - a.y) * g };
}

/** Which station stands on a tile, such as a square's door, if any. */
export function stationAt(ride: Ride, tile: Tile): number | undefined {
  const stations = ride.track.filter((piece) => piece.kind === 'coaster-station');
  const n = stations.findIndex((piece) => piece.x === tile.x && piece.y === tile.y);
  return n < 0 ? undefined : n;
}
