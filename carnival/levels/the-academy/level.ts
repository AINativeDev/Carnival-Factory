import type { NorthPoleLevel } from '../../../src/northpole/level';

/**
 * The Academy: one classroom inside, with a lesson to discover for each
 * section of the real Academy (ADR 0040). Reference stands by the
 * bookshelves, Skill Foundations before the blackboard, Tuning Your Agent at
 * the projector screen, Quickstart by the teacher's desk, and Code Review
 * Loops among the pupils' desks, on a carpet in rows. Windows look out on the
 * snow, and the doors to the sleigh home are in the left wall. Plain data:
 * the engine checks it and draws it (ADR 0035).
 */
const level: NorthPoleLevel = {
  id: 'the-academy',
  name: 'The Academy',
  description:
    'A classroom with a lesson to find for each part of the Academy, from your first skill to code review loops.',
  theme: 'gingerbread',
  indoor: true,
  size: 15,
  ground: [{ tile: 'carpet', area: { x: 5, y: 6, w: 7, h: 6 } }],
  props: [
    // The upper right wall: windows over the bookshelves, the blackboard, and more windows.
    { kind: 'wall-window', x: 1, y: 0, variant: 0.1 },
    { kind: 'wall-window', x: 3, y: 0, variant: 0.5 },
    { kind: 'wall-window', x: 5, y: 0, variant: 0.9 },
    { kind: 'blackboard', x: 7, y: 0 },
    { kind: 'wall-window', x: 11, y: 0, variant: 0.3 },
    { kind: 'wall-window', x: 13, y: 0, variant: 0.8 },
    // The upper left wall: windows, the projector screen, and the doors to the sleigh home.
    { kind: 'wall-window', x: 0, y: 2, variant: 0.3 },
    { kind: 'projector-screen', x: 0, y: 5, variant: 0.4 },
    { kind: 'wall-window', x: 0, y: 8, variant: 0.7 },
    { kind: 'wall-door', x: 0, y: 11 },
    { kind: 'shelf', x: 1, y: 1, variant: 0.2 },
    { kind: 'shelf', x: 3, y: 1, variant: 0.6 },
    // The teacher's desk, and the pupils' desks in rows on the carpet.
    { kind: 'desk', x: 13, y: 10, variant: 0.9 },
    { kind: 'desk', x: 6, y: 7, variant: 0.1 },
    { kind: 'desk', x: 8, y: 7, variant: 0.2 },
    { kind: 'desk', x: 6, y: 9, variant: 0.1 },
    { kind: 'desk', x: 8, y: 9, variant: 0.2 },
    { kind: 'desk', x: 10, y: 7, variant: 0.3 },
    { kind: 'desk', x: 5, y: 11, variant: 0.4 },
    // A reading corner, the globe and plants.
    { kind: 'rug', x: 2, y: 9, variant: 0.8 },
    { kind: 'globe', x: 13, y: 12, variant: 0.3 },
    { kind: 'plant', x: 1, y: 14, variant: 0.3 },
    { kind: 'plant', x: 14, y: 14, variant: 0.6 },
    { kind: 'plant', x: 6, y: 1, variant: 0.9 },
  ],
  arrival: { x: 5, y: 14 },
  exits: [{ x: 1, y: 11 }],
  // In the Academy's order. Each one's door has a clear tile on its east, where no other display stands in front of it on screen.
  squares: [
    { id: 'quickstart', x: 11, y: 8 },
    { id: 'skill-foundations', x: 8, y: 1 },
    { id: 'tuning-your-agent', x: 1, y: 6 },
    { id: 'code-review-loops', x: 7, y: 11 },
    { id: 'reference', x: 3, y: 2 },
  ],
};

export default level;
