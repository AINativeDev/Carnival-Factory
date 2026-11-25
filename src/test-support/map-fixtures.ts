/**
 * The squares, levels and options the map's tests start it with: small, fixed
 * and made up, so a pinned frame only changes when the map's own drawing does,
 * never when someone adds a booth to the carnival.
 */
import { levelWorld, type NorthPoleLevel } from '../northpole/level';
import type { MapOptions, SquareKind } from '../northpole/map-options';
import type { NorthPoleSquare } from '../northpole/square';

/** A square that paints its whole face, and a mark where the pointer is, if it has one. */
export const square = (id: string, draw?: NorthPoleSquare['draw']): NorthPoleSquare => ({
  id,
  name: `The ${id}`,
  description: `What ${id} shows.`,
  draw:
    draw ??
    ((ctx, size, time, pointer) => {
      ctx.fillStyle = 'square';
      ctx.fillRect(0, 0, size, size * ((time % 1000) / 1000));
      if (pointer) ctx.fillRect(pointer.x, pointer.y, pointer.down ? 2 : 1, pointer.presses);
    }),
});

/** A square that throws, for the "Under construction" placeholder. */
const broken = square('broken', () => {
  throw new Error('a broken square');
});

/** A small level with a pond, two squares and a sleigh home. */
export const LEVEL: NorthPoleLevel = {
  id: 'tester',
  name: 'Test Fair',
  description: 'A fair for tests.',
  theme: 'frozen-lake',
  size: 13,
  ground: [{ tile: 'path', area: { x: 1, y: 6, w: 11, h: 1 } }],
  props: [
    { kind: 'pond', x: 7, y: 1 },
    { kind: 'lamp', x: 5, y: 5 },
    { kind: 'pine', x: 0, y: 0, variant: 0.3 },
    { kind: 'drift', x: 1, y: 10 },
  ],
  arrival: { x: 6, y: 9 },
  exits: [{ x: 8, y: 9 }],
  squares: [
    { id: 'skates', x: 2, y: 2 },
    { id: 'cocoa', x: 2, y: 7 },
  ],
};

/** What the map told the page, in order. */
export type Told = (string | undefined)[][];

/** Options for walking the test level, with every message to the page noted in `told`. */
export function levelOptions(told: Told, extra: Partial<MapOptions> = {}): MapOptions {
  return {
    attractions: [square('skates'), square('cocoa')],
    booths: [],
    level: { id: 'tester', name: 'Test Fair', world: levelWorld(LEVEL), tint: 'tint' },
    ...noted(told),
    ...extra,
  };
}

/** Options for the North Pole with a few booths, attractions and a sleigh station. */
export function northPoleOptions(told: Told, extra: Partial<MapOptions> = {}): MapOptions {
  return {
    attractions: [square('ferris-wheel'), broken],
    booths: [square('jedi4ever'), square('comet'), square('dancer')],
    levels: [
      { login: 'tester', name: 'Test Fair', color: 'sign', closed: false },
      { login: 'shut', name: 'Shut Fair', color: 'sign', closed: true, owner: 'The North Pole' },
    ],
    ...noted(told),
    ...extra,
  };
}

const noted = (told: Told) => ({
  onOpen: (kind: SquareKind, id: string) => told.push(['open', kind, id]),
  onLeave: () => told.push(['leave']),
  onSelect: (picked: { kind: SquareKind; id: string } | undefined) =>
    told.push(['select', picked?.kind, picked?.id]),
  onTravel: (login: string | undefined) => told.push(['travel', login]),
});
