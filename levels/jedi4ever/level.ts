import type { NorthPoleLevel } from '../../northpole/level';

/**
 * The Frozen Lake Fair: a small fair round a frozen lake, with skaters going
 * round, a skate rental, a cocoa hut and an ice-fishing hole, and the sleigh
 * home by the arrival point. Plain data: the engine checks it and draws it.
 */
const level: NorthPoleLevel = {
  id: 'jedi4ever',
  name: 'Frozen Lake Fair',
  description:
    'A little fair round a frozen lake: rent some skates, warm up with cocoa, and try your luck at ice fishing.',
  theme: 'frozen-lake',
  size: 21,
  ground: [
    { tile: 'path', area: { x: 2, y: 11, w: 16, h: 1 } },
    { tile: 'path', area: { x: 10, y: 11, w: 1, h: 7 } },
    { tile: 'path', area: { x: 6, y: 4, w: 1, h: 7 } },
    { tile: 'path', area: { x: 16, y: 4, w: 1, h: 7 } },
    { tile: 'path', area: { x: 6, y: 4, w: 11, h: 1 } },
    { tile: 'water', area: { x: 18, y: 0, w: 1, h: 21 } },
    { tile: 'bridge', area: { x: 18, y: 11 } },
  ],
  props: [
    { kind: 'pond', x: 9, y: 6 },
    { kind: 'town-tree', x: 11, y: 2 },
    { kind: 'cabin', x: 1, y: 1 },
    { kind: 'tent', x: 14, y: 1 },
    { kind: 'lamp', x: 7, y: 5 },
    { kind: 'lamp', x: 15, y: 5 },
    { kind: 'lamp', x: 9, y: 12 },
    { kind: 'lamp', x: 15, y: 12 },
    { kind: 'bench', x: 8, y: 10 },
    { kind: 'bench', x: 13, y: 10 },
    { kind: 'cart', x: 3, y: 12 },
    { kind: 'sleigh', x: 6, y: 17, variant: 0.4 },
    { kind: 'banner', x: 9, y: 15 },
    { kind: 'pine', x: 0, y: 6, variant: 0.2 },
    { kind: 'pine', x: 1, y: 8, variant: 0.6 },
    { kind: 'pine', x: 0, y: 14, variant: 0.3 },
    { kind: 'pine', x: 1, y: 17, variant: 0.8 },
    { kind: 'pine', x: 3, y: 19, variant: 0.1 },
    { kind: 'pine', x: 5, y: 20, variant: 0.5 },
    { kind: 'pine', x: 13, y: 20, variant: 0.7 },
    { kind: 'pine', x: 16, y: 19, variant: 0.9 },
    { kind: 'pine', x: 19, y: 3, variant: 0.4 },
    { kind: 'pine', x: 20, y: 7, variant: 0.2 },
    { kind: 'pine', x: 19, y: 15, variant: 0.6 },
    { kind: 'pine', x: 20, y: 18, variant: 0.3 },
    { kind: 'pine', x: 5, y: 0, variant: 0.7 },
    { kind: 'pine', x: 8, y: 1, variant: 0.1 },
    { kind: 'drift', x: 4, y: 8 },
    { kind: 'drift', x: 13, y: 14 },
    { kind: 'drift', x: 2, y: 15 },
    { kind: 'drift', x: 17, y: 2 },
  ],
  arrival: { x: 10, y: 17 },
  exits: [{ x: 12, y: 17 }],
  squares: [
    { id: 'skate-rental', x: 4, y: 6 },
    { id: 'cocoa-hut', x: 14, y: 6 },
    { id: 'ice-fishing', x: 4, y: 12 },
  ],
};

export default level;
