/**
 * The pieces a level's roller coaster is laid from, and what each one does to
 * the car riding it: how long it takes over its tile, and how high its rail
 * runs. A lift hill climbs slowly on its chain, a drop is quick, and a
 * station is where a ride level's car stops (ADR 0039, ADR 0041). Plain
 * values, so the ride, the drawing and the checks agree on them.
 */

/** Every kind of coaster piece, one tile each. */
const TRACK_KINDS = [
  'coaster',
  'coaster-loop',
  'coaster-lift',
  'coaster-drop',
  'coaster-station',
] as const;
export type TrackKind = (typeof TRACK_KINDS)[number];

/** Whether a prop or a thing is a piece of the coaster. */
export const isTrack = (kind: string): kind is TrackKind =>
  (TRACK_KINDS as readonly string[]).includes(kind);

/** How long the car takes over a tile of each piece, in milliseconds: calm on the flat, slow up the chain, quick down a drop. */
export const STRAIGHT_TIME = 400;
export const LOOP_TIME = 1800;
const TIMES: Record<TrackKind, number> = {
  coaster: STRAIGHT_TIME,
  'coaster-loop': LOOP_TIME,
  'coaster-lift': 900,
  'coaster-drop': 220,
  'coaster-station': STRAIGHT_TIME,
};
export const timeOn = (kind: string) => (isTrack(kind) ? TIMES[kind] : STRAIGHT_TIME);

/** How high the rail runs over the snow at its lowest, in pixels: high enough to walk under. */
export const RAIL = 24;
/** How much higher a piece's `variant` lifts its rail, at 1: four times as high in all. */
const CLIMB = 3;

/** How high a piece's rail runs, from its variant: the lowest at 0, so a plain coaster stays as it was. */
export const heightOf = (seed: number) => RAIL * (1 + CLIMB * seed);

/** The station: the piece a ride level's car stops at, at a stall's door. */
export const STATION = 'coaster-station';
/**
 * How far in front a station is drawn of what shares its depth: it stands at
 * a door, just in front of its stall's side, so the stall mustn't hide the
 * car stopped there.
 */
export const IN_FRONT = 0.5;
