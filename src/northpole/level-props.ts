/**
 * The catalogue a level places its props from: the North Pole's scenery, and
 * the show (performers, rides, factory dressing, the coaster and an indoor
 * level's furniture, drawn by way of `show.ts`). `validateLevel` and
 * `levelWorld` in `level.ts` read each one's footprint from here.
 */
import type { Box, ThingKind, Tile, WallSide } from './world';

/**
 * The engine's catalogue of North Pole things a level may place, with the
 * tiles each one covers and whether it stops people walking through it. The
 * pond is the one prop that's ground: a sheet of ice that skaters go round.
 */
export const LEVEL_PROPS = {
  pine: { thing: 'tree', w: 1, h: 1, blocks: true },
  drift: { thing: 'drift', w: 1, h: 1, blocks: false },
  cabin: { thing: 'cabin', w: 3, h: 3, blocks: true },
  lamp: { thing: 'lamp', w: 1, h: 1, blocks: true },
  fence: { thing: 'fence', w: 1, h: 1, blocks: true },
  stable: { thing: 'stable', w: 4, h: 3, blocks: true },
  sleigh: { thing: 'sleigh', w: 2, h: 1, blocks: true },
  'town-tree': { thing: 'town-tree', w: 1, h: 1, blocks: true },
  tent: { thing: 'tent', w: 2, h: 2, blocks: true },
  bench: { thing: 'bench', w: 1, h: 1, blocks: true },
  cart: { thing: 'cart', w: 1, h: 1, blocks: true },
  banner: { thing: 'banner', w: 3, h: 1, blocks: false },
  bunting: { thing: 'bunting', w: 1, h: 5, blocks: false },
  pond: { thing: undefined, w: 5, h: 4, blocks: true },
  // The show: performers on a tile or two, and rides on bigger footprints.
  'fire-breather': { thing: 'fire-breather', w: 1, h: 1, blocks: true },
  juggler: { thing: 'juggler', w: 1, h: 1, blocks: true },
  'stilt-walker': { thing: 'stilt-walker', w: 2, h: 1, blocks: true },
  acrobats: { thing: 'acrobats', w: 1, h: 1, blocks: true },
  band: { thing: 'band', w: 1, h: 1, blocks: true },
  strongman: { thing: 'strongman', w: 1, h: 1, blocks: true },
  'ferris-wheel': { thing: 'ferris-wheel', w: 3, h: 3, blocks: true },
  carousel: { thing: 'carousel', w: 3, h: 3, blocks: true },
  balloon: { thing: 'balloon', w: 2, h: 2, blocks: true },
  // Factory dressing. The lantern floats overhead, so people walk under it.
  conveyor: { thing: 'conveyor', w: 1, h: 3, blocks: true },
  cog: { thing: 'cog', w: 1, h: 1, blocks: true },
  'candy-pipe': { thing: 'candy-pipe', w: 2, h: 1, blocks: true },
  lantern: { thing: 'lantern', w: 1, h: 1, blocks: false },
  // The roller coaster, ridden by a golden ticket in the order its pieces are
  // listed (`coaster-ride.ts`). Its rail runs overhead on posts, as high as a
  // piece's variant lifts it, so people walk under it; a loop stands on an
  // A-frame over its tile. A lift hill climbs on a chain, a drop is quick, and a
  // station is where a ride level's car stops (`coaster-pieces.ts`, ADR 0041).
  coaster: { thing: 'coaster', w: 1, h: 1, blocks: false },
  'coaster-loop': { thing: 'coaster-loop', w: 1, h: 1, blocks: true },
  'coaster-lift': { thing: 'coaster-lift', w: 1, h: 1, blocks: false },
  'coaster-drop': { thing: 'coaster-drop', w: 1, h: 1, blocks: false },
  'coaster-station': { thing: 'coaster-station', w: 1, h: 1, blocks: false },
  // An indoor level's furniture (ADR 0040). The rug and the cable lie flat, so people walk over them.
  plant: { thing: 'plant', w: 1, h: 1, blocks: true },
  shelf: { thing: 'shelf', w: 2, h: 1, blocks: true },
  rug: { thing: 'rug', w: 2, h: 2, blocks: false },
  sofa: { thing: 'sofa', w: 2, h: 1, blocks: true },
  desk: { thing: 'desk', w: 1, h: 1, blocks: true },
  globe: { thing: 'globe', w: 1, h: 1, blocks: true },
  spotlight: { thing: 'spotlight', w: 1, h: 1, blocks: true },
  cable: { thing: 'cable', w: 1, h: 1, blocks: false },
  // What hangs on a back wall: `w` tiles along it, on the wall's own row of tiles.
  'acoustic-panel': { thing: 'acoustic-panel', w: 1, h: 1, blocks: true, wall: true },
  'wall-window': { thing: 'wall-window', w: 1, h: 1, blocks: true, wall: true },
  blackboard: { thing: 'blackboard', w: 3, h: 1, blocks: true, wall: true },
  'projector-screen': { thing: 'projector-screen', w: 2, h: 1, blocks: true, wall: true },
  'on-air-light': { thing: 'on-air-light', w: 1, h: 1, blocks: true, wall: true },
  'wall-door': { thing: 'wall-door', w: 2, h: 1, blocks: true, wall: true },
  // A gallery's art and its dressing (ADR 0047). The mobile and the mirrorball hang overhead, and confetti lies flat.
  'framed-picture': { thing: 'framed-picture', w: 1, h: 1, blocks: true, wall: true },
  'neon-art': { thing: 'neon-art', w: 3, h: 1, blocks: true, wall: true },
  'wall-sign': { thing: 'wall-sign', w: 3, h: 1, blocks: true, wall: true },
  statue: { thing: 'statue', w: 1, h: 1, blocks: true },
  mobile: { thing: 'mobile', w: 1, h: 1, blocks: false },
  'velvet-rope': { thing: 'velvet-rope', w: 1, h: 1, blocks: true },
  'art-sign': { thing: 'art-sign', w: 1, h: 1, blocks: true },
  'gallery-elf': { thing: 'gallery-elf', w: 1, h: 1, blocks: true },
  balloons: { thing: 'balloons', w: 1, h: 1, blocks: true },
  confetti: { thing: 'confetti', w: 1, h: 1, blocks: false },
  mirrorball: { thing: 'mirrorball', w: 1, h: 1, blocks: false },
} as const satisfies Record<
  string,
  { thing: ThingKind | undefined; w: number; h: number; blocks: boolean; wall?: true }
>;
export type LevelPropKind = keyof typeof LEVEL_PROPS;

/** Whether a prop hangs on a back wall, so only an indoor level may place it. */
export const hangsOnWall = (kind: LevelPropKind): boolean => 'wall' in LEVEL_PROPS[kind];

/**
 * The tiles a prop covers from its north corner `at`, and the wall it hangs
 * on, if it does: along the upper right wall when it's on row 0, and down the
 * upper left one otherwise, where it turns to run along `y`.
 */
export function propPlace(kind: LevelPropKind, at: Tile): { box: Box; wall?: WallSide } {
  const { w, h } = LEVEL_PROPS[kind];
  if (!hangsOnWall(kind)) return { box: { x: at.x, y: at.y, w, h } };
  return at.y === 0
    ? { box: { x: at.x, y: at.y, w, h: 1 }, wall: 'right' }
    : { box: { x: at.x, y: at.y, w: 1, h: w }, wall: 'left' };
}
