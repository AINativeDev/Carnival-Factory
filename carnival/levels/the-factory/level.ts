import type { NorthPoleLevel } from '../../../src/northpole/level';

/**
 * The Factory: the North Pole's own level, a walk through how a booth gets
 * built. The path runs from the arrival point up the first lane, past the
 * letter box, the assessment desk and the workshop, across the top, and down
 * the second lane past the inspection bench, the gate and the map, to the
 * sleigh home. Plain data: the engine checks it and draws it (ADR 0035).
 */
const level: NorthPoleLevel = {
  id: 'the-factory',
  name: 'The Factory',
  description:
    'Walk the build loop one stall at a time: from a letter with a wish to a booth on the map.',
  theme: 'dusk',
  size: 21,
  ground: [
    { tile: 'path', area: { x: 6, y: 2, w: 1, h: 18 } },
    { tile: 'path', area: { x: 6, y: 2, w: 9, h: 1 } },
    { tile: 'path', area: { x: 14, y: 2, w: 1, h: 17 } },
    { tile: 'water', area: { x: 17, y: 0, w: 1, h: 21 } },
    { tile: 'bridge', area: { x: 17, y: 10 } },
  ],
  props: [
    { kind: 'banner', x: 8, y: 4 },
    { kind: 'town-tree', x: 10, y: 10 },
    { kind: 'cabin', x: 8, y: 14 },
    { kind: 'cart', x: 7, y: 17 },
    { kind: 'lamp', x: 7, y: 6 },
    { kind: 'lamp', x: 7, y: 11 },
    { kind: 'lamp', x: 13, y: 7 },
    { kind: 'lamp', x: 13, y: 12 },
    { kind: 'lamp', x: 10, y: 1 },
    { kind: 'bench', x: 9, y: 8 },
    { kind: 'bench', x: 11, y: 12 },
    { kind: 'sleigh', x: 9, y: 19, variant: 0.3 },
    { kind: 'fence', x: 15, y: 5 },
    { kind: 'fence', x: 15, y: 6 },
    { kind: 'fence', x: 15, y: 7 },
    { kind: 'pine', x: 1, y: 2, variant: 0.2 },
    { kind: 'pine', x: 2, y: 6, variant: 0.6 },
    { kind: 'pine', x: 1, y: 10, variant: 0.3 },
    { kind: 'pine', x: 2, y: 15, variant: 0.8 },
    { kind: 'pine', x: 1, y: 19, variant: 0.1 },
    { kind: 'pine', x: 3, y: 0, variant: 0.5 },
    { kind: 'pine', x: 13, y: 0, variant: 0.7 },
    { kind: 'pine', x: 19, y: 3, variant: 0.4 },
    { kind: 'pine', x: 20, y: 8, variant: 0.9 },
    { kind: 'pine', x: 19, y: 14, variant: 0.2 },
    { kind: 'pine', x: 20, y: 19, variant: 0.6 },
    { kind: 'drift', x: 3, y: 12 },
    { kind: 'drift', x: 11, y: 5 },
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
