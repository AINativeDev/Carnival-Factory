/**
 * A small ride level for the tests (ADR 0041): a coaster round an 11 by 11
 * level with a lift hill, a drop and a loop, and a station at its sleigh
 * home's door and at each of its two squares' doors. Made up and fixed, so a
 * pinned ride only changes when the ride's own code does.
 */
import { levelWorld, type LevelProp, type NorthPoleLevel } from '../northpole/level';
import type { MapOptions } from '../northpole/map-options';
import type { Tile } from '../northpole/world';
import { square, type Told } from './map-fixtures';

/** The tiles from each corner to the next, in order, without the last corner twice. */
function along(corners: [Tile, ...Tile[]]): Tile[] {
  const tiles: Tile[] = [];
  corners.reduce((from, to) => {
    const steps = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
    for (let s = 0; s < steps; s++)
      tiles.push({
        x: from.x + Math.sign(to.x - from.x) * s,
        y: from.y + Math.sign(to.y - from.y) * s,
      });
    return to;
  });
  return tiles;
}

/** What stands on a tile of track other than plain coaster, and how high. */
const FITTINGS = new Map<string, Omit<LevelProp, 'x' | 'y'>>(
  Object.entries({
    '3,7': { kind: 'coaster-station' },
    '3,6': { kind: 'coaster-lift', variant: 0.2 },
    '3,5': { kind: 'coaster-lift', variant: 0.4 },
    '3,4': { kind: 'coaster-drop', variant: 0.1 },
    '3,2': { kind: 'coaster-station' },
    '5,1': { kind: 'coaster-loop' },
    '8,5': { kind: 'coaster-station' },
  }),
);

/** The track: up from the sleigh home past the skates, across, down past the cocoa and back. */
export const RIDE_TRACK: LevelProp[] = along([
  { x: 3, y: 7 },
  { x: 3, y: 1 },
  { x: 8, y: 1 },
  { x: 8, y: 8 },
  { x: 3, y: 8 },
  { x: 3, y: 7 },
]).map(({ x, y }) => ({ kind: 'coaster', ...FITTINGS.get(`${String(x)},${String(y)}`), x, y }));

export const RIDE_LEVEL: NorthPoleLevel = {
  id: 'rider',
  name: 'Ride Fair',
  description: 'A ride for tests.',
  theme: 'aurora-night',
  size: 11,
  ride: true,
  props: [...RIDE_TRACK, { kind: 'pine', x: 0, y: 0 }],
  arrival: { x: 3, y: 7 },
  exits: [{ x: 1, y: 7 }],
  squares: [
    { id: 'skates', x: 1, y: 2 },
    { id: 'cocoa', x: 6, y: 5 },
  ],
};

let rides = 0;

/** Options for riding the test level, in a world of its own each time, with every message to the page noted in `told`. */
export function rideOptions(told: Told, extra: Partial<MapOptions> = {}): MapOptions {
  return {
    attractions: [square('skates'), square('cocoa')],
    booths: [],
    level: {
      id: `rider-${String(++rides)}`,
      name: 'Ride Fair',
      world: levelWorld(RIDE_LEVEL),
      tint: 'tint',
      ride: true,
    },
    onOpen: (kind, id) => told.push(['open', kind, id]),
    onLeave: () => told.push(['leave']),
    onSelect: (picked) => told.push(['select', picked?.kind, picked?.id]),
    onTravel: (login) => told.push(['travel', login]),
    ...extra,
  };
}
