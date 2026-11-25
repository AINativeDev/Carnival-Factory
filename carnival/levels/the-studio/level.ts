import type { NorthPoleLevel } from '../../../src/northpole/level';

/**
 * The Recording Studio: the North Pole's own studio lot, where the podcast is
 * recorded and the videos are made. The path runs from the arrival point up
 * the first lane, past the Podcast Booth, the Video Set and the Control Room,
 * across the top under a banner, and down the second lane past the Green Room
 * and the Broadcast Tower, to the sleigh home. Plain data: the engine checks
 * it and draws it (ADR 0035).
 */
const level: NorthPoleLevel = {
  id: 'the-studio',
  name: 'The Recording Studio',
  description:
    'A studio lot where the podcast is recorded and the videos are made, from the microphone to the broadcast tower.',
  theme: 'dusk',
  size: 21,
  ground: [
    { tile: 'path', area: { x: 6, y: 2, w: 1, h: 18 } },
    { tile: 'path', area: { x: 6, y: 2, w: 9, h: 1 } },
    { tile: 'path', area: { x: 14, y: 2, w: 1, h: 17 } },
    { tile: 'path', area: { x: 7, y: 10, w: 7, h: 1 } },
    { tile: 'water', area: { x: 17, y: 0, w: 1, h: 21 } },
    { tile: 'bridge', area: { x: 17, y: 7 } },
  ],
  props: [
    // The lot between the lanes: a live band, performers rehearsing, a coffee cart and bunting.
    { kind: 'band', x: 9, y: 6 },
    { kind: 'juggler', x: 11, y: 13, variant: 0.4 },
    { kind: 'acrobats', x: 9, y: 14 },
    { kind: 'stilt-walker', x: 10, y: 4 },
    { kind: 'cart', x: 8, y: 12 },
    { kind: 'tent', x: 9, y: 16 },
    { kind: 'banner', x: 9, y: 2 },
    { kind: 'bunting', x: 8, y: 3 },
    // Studio lights: lamps beside the lanes and lanterns over them.
    { kind: 'lamp', x: 7, y: 8 },
    { kind: 'lamp', x: 7, y: 13 },
    { kind: 'lamp', x: 13, y: 8 },
    { kind: 'lamp', x: 13, y: 17 },
    { kind: 'lantern', x: 6, y: 4, variant: 0.3 },
    { kind: 'lantern', x: 10, y: 10, variant: 0.7 },
    { kind: 'lantern', x: 14, y: 15, variant: 0.5 },
    // Over the bridge: the fair the crew goes to after a show.
    { kind: 'ferris-wheel', x: 18, y: 12 },
    { kind: 'balloon', x: 18, y: 2 },
    { kind: 'sleigh', x: 8, y: 19, variant: 0.6 },
    { kind: 'pine', x: 1, y: 2, variant: 0.2 },
    { kind: 'pine', x: 2, y: 7, variant: 0.6 },
    { kind: 'pine', x: 1, y: 12, variant: 0.3 },
    { kind: 'pine', x: 2, y: 17, variant: 0.8 },
    { kind: 'pine', x: 3, y: 0, variant: 0.5 },
    { kind: 'pine', x: 13, y: 0, variant: 0.7 },
    { kind: 'pine', x: 20, y: 9, variant: 0.4 },
    { kind: 'pine', x: 20, y: 19, variant: 0.6 },
    { kind: 'drift', x: 3, y: 14 },
    { kind: 'drift', x: 16, y: 4 },
    { kind: 'drift', x: 4, y: 20 },
  ],
  arrival: { x: 6, y: 19 },
  exits: [{ x: 12, y: 18 }],
  // In the order a show is made along the path, staggered so no stall hides another's door on screen.
  squares: [
    { id: 'podcast-booth', x: 4, y: 15 },
    { id: 'video-set', x: 4, y: 10 },
    { id: 'control-room', x: 4, y: 5 },
    { id: 'green-room', x: 12, y: 5 },
    { id: 'broadcast-tower', x: 12, y: 13 },
  ],
};

export default level;
