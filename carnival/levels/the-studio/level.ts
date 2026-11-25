import type { NorthPoleLevel } from '../../../src/northpole/level';

/**
 * The Recording Studio: one room inside, where the podcast is recorded and
 * the videos are made (ADR 0040). The sound booth's corner, carpeted and lined
 * with foam panels, has the microphone and the headphones; the mixing desk
 * stands out in the room, facing the window to the booth; the video set has
 * the camera between two spotlights before a backdrop; the guests' sofa is on
 * a carpet by the front; and the ON AIR light glows by the doors to the sleigh
 * home. Each item is a display to walk up to. Plain data: the engine checks
 * it and draws it (ADR 0035).
 */
const level: NorthPoleLevel = {
  id: 'the-studio',
  name: 'The Recording Studio',
  description:
    'A studio room where the podcast is recorded and the videos are made: walk up to the gear to find out what each piece does.',
  theme: 'dusk',
  indoor: true,
  size: 15,
  ground: [
    // The sound booth's corner, and the green room's carpet by the front.
    { tile: 'carpet', area: { x: 1, y: 1, w: 5, h: 8 } },
    { tile: 'carpet', area: { x: 7, y: 8, w: 5, h: 4 } },
  ],
  props: [
    // Foam panels round the sound booth, on both back walls.
    { kind: 'acoustic-panel', x: 1, y: 0 },
    { kind: 'acoustic-panel', x: 2, y: 0 },
    { kind: 'acoustic-panel', x: 3, y: 0 },
    { kind: 'acoustic-panel', x: 4, y: 0 },
    { kind: 'acoustic-panel', x: 0, y: 1 },
    { kind: 'acoustic-panel', x: 0, y: 2 },
    { kind: 'acoustic-panel', x: 0, y: 3 },
    { kind: 'acoustic-panel', x: 0, y: 4 },
    { kind: 'acoustic-panel', x: 0, y: 5 },
    { kind: 'acoustic-panel', x: 0, y: 6 },
    { kind: 'acoustic-panel', x: 0, y: 7 },
    // The window to the booth, the doors home and the ON AIR light by them.
    { kind: 'wall-window', x: 5, y: 0, variant: 0.2 },
    { kind: 'wall-window', x: 6, y: 0, variant: 0.6 },
    { kind: 'wall-door', x: 11, y: 0 },
    { kind: 'on-air-light', x: 13, y: 0 },
    // The video set: a backdrop on the wall, and two spotlights on it.
    { kind: 'projector-screen', x: 0, y: 10, variant: 0.3 },
    { kind: 'spotlight', x: 2, y: 9, variant: 0.8 },
    { kind: 'spotlight', x: 2, y: 12, variant: 0.8 },
    // Cables from the booth to the desk, and from the camera across the floor.
    { kind: 'cable', x: 4, y: 4, variant: 0.3 },
    { kind: 'cable', x: 7, y: 3, variant: 0.7 },
    { kind: 'cable', x: 5, y: 10, variant: 0.5 },
    // The guests' sofa, and plants.
    { kind: 'sofa', x: 9, y: 11, variant: 0.8 },
    { kind: 'plant', x: 13, y: 8, variant: 0.4 },
    { kind: 'plant', x: 10, y: 13, variant: 0.7 },
    { kind: 'plant', x: 13, y: 13, variant: 0.2 },
    { kind: 'plant', x: 1, y: 13, variant: 0.9 },
    { kind: 'plant', x: 9, y: 1, variant: 0.5 },
  ],
  arrival: { x: 7, y: 14 },
  exits: [{ x: 11, y: 1 }],
  // The gear in the order a show is made: recorded, mixed, filmed, put on air, with the guests and the episodes.
  // Each one's door has a clear tile on its east, where no other display, nor the sign of the sleigh
  // home, stands in front of it on screen: under the window, the mixing desk's was behind that sign.
  squares: [
    { id: 'microphone', x: 1, y: 3 },
    { id: 'headphones', x: 1, y: 7 },
    { id: 'mixing-desk', x: 10, y: 3 },
    { id: 'camera', x: 3, y: 10 },
    { id: 'on-air', x: 11, y: 6 },
    { id: 'guest-sofa', x: 9, y: 9 },
    { id: 'episode-wall', x: 5, y: 12 },
  ],
};

export default level;
