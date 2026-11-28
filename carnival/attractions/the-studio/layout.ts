/**
 * Where everything in the studio stands, in the square's 0 to 100 units: one
 * composition for every screen, as the Tessl places share it. A slim header
 * (the ON AIR sign, the signal and the score in one row), the lit studio as the
 * scene, and a footer with the hint and the one button. Everything keeps a
 * margin of 4 from the square's edges, so nothing is ever clipped there.
 */

/** The safe margin on every side. */
export const MARGIN = 4;

/** The header's row: where its micro labels sit, and the middle of its values. */
export const HEADER = { top: 4, label: 5.6, value: 10.6, bottom: 13.6 } as const;

/** The scene: the studio itself, a lit diorama seen from the front. */
export const SCENE = { x: 4, y: 16, w: 92, h: 64 } as const;

/** The footer under the scene: the hint on the left, the one button on the right. */
export const FOOTER = { top: 83, mid: 89.5, bottom: 96 } as const;

/** The word track, a screen on the wall: its edges, its middle line, the ring and where words come in. */
export const LANE = { left: 46, right: 92, y: 46, half: 7, ring: 52.6, far: 85 } as const;

/** Where the host's head is, and how big. */
export const HEAD = { x: 23, y: 49, r: 7 } as const;

/** Where the mic's grille ends and its body begins. */
export const MIC = { x: 37.5, y: 51 } as const;

/** The desk across the front: its ends, its top and its front's foot. */
export const DESK = { left: 7, right: 80, top: 60, front: 62.6, foot: 69 } as const;

/** The window onto the dusk, high on the wall over the track. */
export const WINDOW = { x: 57, y: 20.5, w: 31, h: 11 } as const;
