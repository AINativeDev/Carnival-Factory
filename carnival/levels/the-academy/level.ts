import type { NorthPoleLevel } from '../../../src/northpole/level';

/**
 * The Academy: the North Pole's own campus, one lesson stall for each section
 * of the real Academy, in its order. The path runs from the arrival point up
 * the first lane, past Quickstart, Skill Foundations and Tuning Your Agent,
 * across the top under a banner, and down the second lane past Code Review
 * Loops and Reference, to the sleigh home. A frozen lake sits in the middle of
 * the quad. Plain data: the engine checks it and draws it (ADR 0035).
 */
const level: NorthPoleLevel = {
  id: 'the-academy',
  name: 'The Academy',
  description:
    'A snowy campus with one lesson stall for each part of the Academy, from your first skill to code review loops.',
  theme: 'frozen-lake',
  size: 21,
  ground: [
    { tile: 'path', area: { x: 6, y: 2, w: 1, h: 18 } },
    { tile: 'path', area: { x: 6, y: 2, w: 9, h: 1 } },
    { tile: 'path', area: { x: 14, y: 2, w: 1, h: 17 } },
    { tile: 'water', area: { x: 17, y: 0, w: 1, h: 21 } },
    { tile: 'bridge', area: { x: 17, y: 10 } },
  ],
  props: [
    // The quad: a frozen lake with skaters, the big tree, benches and the school band.
    { kind: 'pond', x: 8, y: 6 },
    { kind: 'town-tree', x: 10, y: 12 },
    { kind: 'bench', x: 8, y: 11 },
    { kind: 'bench', x: 11, y: 14 },
    { kind: 'band', x: 9, y: 15 },
    { kind: 'cabin', x: 8, y: 17 },
    { kind: 'banner', x: 9, y: 2 },
    // Lamps beside the lanes, and lanterns over them, for the walk between lessons.
    { kind: 'lamp', x: 7, y: 9 },
    { kind: 'lamp', x: 7, y: 14 },
    { kind: 'lamp', x: 13, y: 8 },
    { kind: 'lamp', x: 13, y: 15 },
    { kind: 'lantern', x: 6, y: 4, variant: 0.2 },
    { kind: 'lantern', x: 14, y: 13, variant: 0.6 },
    // Over the bridge: a tent and a balloon, for the end of term.
    { kind: 'tent', x: 18, y: 13 },
    { kind: 'balloon', x: 18, y: 5 },
    { kind: 'pine', x: 1, y: 2, variant: 0.2 },
    { kind: 'pine', x: 2, y: 6, variant: 0.6 },
    { kind: 'pine', x: 1, y: 10, variant: 0.3 },
    { kind: 'pine', x: 2, y: 14, variant: 0.8 },
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
  // In the Academy's order along the path, staggered so no stall hides another's door on screen.
  squares: [
    { id: 'quickstart', x: 4, y: 16 },
    { id: 'skill-foundations', x: 4, y: 11 },
    { id: 'tuning-your-agent', x: 4, y: 7 },
    { id: 'code-review-loops', x: 12, y: 4 },
    { id: 'reference', x: 12, y: 10 },
  ],
};

export default level;
