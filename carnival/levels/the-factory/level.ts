import type { NorthPoleLevel } from '../../../src/northpole/level';

/**
 * The Factory: the North Pole's own level, a walk through how a booth gets
 * built. The path runs from the arrival point up the first lane, past the
 * letter box, the assessment desk and the workshop, across the top, and down
 * the second lane past the inspection bench, the gate and the map, to the
 * sleigh home. Beside it runs a roller coaster, with a loop-the-loop at every
 * stall, and a golden ticket, the visitor's request, rides it from the first
 * loop to the last. Plain data: the engine checks it and draws it (ADR 0035).
 */
const level: NorthPoleLevel = {
  id: 'the-factory',
  name: 'The Factory',
  description:
    'Walk the build loop one stall at a time: from a letter with a wish to a booth on the map.',
  theme: 'aurora-night',
  size: 21,
  ground: [
    { tile: 'path', area: { x: 6, y: 2, w: 1, h: 18 } },
    { tile: 'path', area: { x: 6, y: 2, w: 9, h: 1 } },
    { tile: 'path', area: { x: 14, y: 2, w: 1, h: 17 } },
    { tile: 'water', area: { x: 17, y: 0, w: 1, h: 21 } },
    { tile: 'bridge', area: { x: 17, y: 10 } },
  ],
  props: [
    // The coaster, ridden in this order: up beside the first lane, across the
    // top over the path, and down beside the second, with a loop just past
    // each stall's door, so it never stands in front of one.
    { kind: 'coaster', x: 7, y: 19 },
    { kind: 'coaster', x: 7, y: 18 },
    { kind: 'coaster', x: 7, y: 17 },
    { kind: 'coaster', x: 7, y: 16 },
    { kind: 'coaster-loop', x: 7, y: 15 },
    { kind: 'coaster', x: 7, y: 14 },
    { kind: 'coaster', x: 7, y: 13 },
    { kind: 'coaster-loop', x: 7, y: 12 },
    { kind: 'coaster', x: 7, y: 11 },
    { kind: 'coaster', x: 7, y: 10 },
    { kind: 'coaster', x: 7, y: 9 },
    { kind: 'coaster', x: 7, y: 8 },
    { kind: 'coaster', x: 7, y: 7 },
    { kind: 'coaster-loop', x: 7, y: 6 },
    { kind: 'coaster', x: 7, y: 5 },
    { kind: 'coaster', x: 7, y: 4 },
    { kind: 'coaster', x: 7, y: 3 },
    { kind: 'coaster', x: 7, y: 2 },
    { kind: 'coaster', x: 7, y: 1 },
    { kind: 'coaster', x: 8, y: 1 },
    { kind: 'coaster', x: 9, y: 1 },
    { kind: 'coaster', x: 10, y: 1 },
    { kind: 'coaster', x: 11, y: 1 },
    { kind: 'coaster', x: 12, y: 1 },
    { kind: 'coaster', x: 13, y: 1 },
    { kind: 'coaster', x: 14, y: 1 },
    { kind: 'coaster', x: 15, y: 1 },
    { kind: 'coaster', x: 15, y: 2 },
    { kind: 'coaster-loop', x: 15, y: 3 },
    { kind: 'coaster', x: 15, y: 4 },
    { kind: 'coaster', x: 15, y: 5 },
    { kind: 'coaster', x: 15, y: 6 },
    { kind: 'coaster', x: 15, y: 7 },
    { kind: 'coaster-loop', x: 15, y: 8 },
    { kind: 'coaster', x: 15, y: 9 },
    { kind: 'coaster', x: 15, y: 10 },
    { kind: 'coaster', x: 15, y: 11 },
    { kind: 'coaster', x: 15, y: 12 },
    { kind: 'coaster', x: 15, y: 13 },
    { kind: 'coaster-loop', x: 15, y: 14 },
    { kind: 'coaster', x: 15, y: 15 },
    { kind: 'coaster', x: 15, y: 16 },
    { kind: 'coaster', x: 15, y: 17 },
    { kind: 'coaster', x: 15, y: 18 },
    { kind: 'coaster', x: 15, y: 19 },
    // The factory floor between the lanes: belts carrying parcels, cogs turning, candy-striped pipes.
    { kind: 'conveyor', x: 9, y: 5 },
    { kind: 'conveyor', x: 11, y: 14 },
    { kind: 'cog', x: 8, y: 9, variant: 0.2 },
    { kind: 'cog', x: 11, y: 7, variant: 0.7 },
    { kind: 'candy-pipe', x: 10, y: 4 },
    { kind: 'candy-pipe', x: 10, y: 17 },
    // Lanterns float over the path, where people walk under them.
    { kind: 'lantern', x: 6, y: 5, variant: 0.1 },
    { kind: 'lantern', x: 6, y: 11, variant: 0.5 },
    { kind: 'lantern', x: 10, y: 2, variant: 0.8 },
    { kind: 'lantern', x: 14, y: 7, variant: 0.3 },
    { kind: 'lantern', x: 14, y: 13, variant: 0.9 },
    // The fair: a carousel, performers and, over the bridge, a ferris wheel and a balloon.
    { kind: 'carousel', x: 8, y: 14 },
    { kind: 'fire-breather', x: 11, y: 10 },
    { kind: 'juggler', x: 8, y: 11, variant: 0.6 },
    { kind: 'acrobats', x: 12, y: 12 },
    { kind: 'band', x: 8, y: 3 },
    { kind: 'ferris-wheel', x: 18, y: 12 },
    { kind: 'balloon', x: 18, y: 5 },
    { kind: 'lamp', x: 8, y: 6 },
    { kind: 'lamp', x: 13, y: 7 },
    { kind: 'sleigh', x: 9, y: 19, variant: 0.3 },
    { kind: 'pine', x: 1, y: 2, variant: 0.2 },
    { kind: 'pine', x: 2, y: 6, variant: 0.6 },
    { kind: 'pine', x: 1, y: 10, variant: 0.3 },
    { kind: 'pine', x: 2, y: 15, variant: 0.8 },
    { kind: 'pine', x: 1, y: 19, variant: 0.1 },
    { kind: 'pine', x: 3, y: 0, variant: 0.5 },
    { kind: 'pine', x: 13, y: 0, variant: 0.7 },
    { kind: 'pine', x: 20, y: 1, variant: 0.4 },
    { kind: 'pine', x: 20, y: 19, variant: 0.6 },
    { kind: 'drift', x: 3, y: 12 },
    { kind: 'drift', x: 16, y: 16 },
    { kind: 'drift', x: 4, y: 19 },
  ],
  arrival: { x: 6, y: 19 },
  exits: [{ x: 12, y: 18 }],
  // Staggered so no stall stands in front of another's door on screen: a
  // pavilion is tall, so one in line with a door across the way hides it, and
  // a click on that door opens the pavilion instead.
  squares: [
    { id: 'letter-box', x: 4, y: 16 },
    { id: 'assessment-desk', x: 4, y: 13 },
    { id: 'workshop', x: 4, y: 7 },
    { id: 'inspection-bench', x: 12, y: 4 },
    { id: 'gate', x: 12, y: 9 },
    { id: 'map', x: 12, y: 15 },
  ],
};

export default level;
