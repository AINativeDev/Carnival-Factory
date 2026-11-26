/**
 * The chase camera: how a spot on the road, `d` metres in front of the camera
 * and `lat` across it, lands on the square. Everything in the scene is placed
 * through `project`, so the road rushes towards you in perspective and bends
 * with the run's distance.
 */

/** Where the horizon sits, as a share of the square's height. */
export const HORIZON = 0.36;
/** How wide the road is at the camera, as a share of the square. */
export const ROAD_HALF = 0.62;
/** The bottom of the picture, where the road would pass under the camera. */
const GROUND = 0.97;
/** How far ahead of the camera the van drives. */
export const VAN_DEPTH = 7;
/** The farthest the road is drawn. */
export const FAR = 150;

/** How far the road has swung sideways at `metres` down it, in road-widths. */
export function bend(metres: number): number {
  return 2.2 * Math.sin(metres / 110) + 1.2 * Math.sin(metres / 47);
}

export interface Placed {
  x: number;
  y: number;
  /** 1 at the camera, shrinking with distance: multiply sizes by it. */
  scale: number;
}

/** Puts a spot on the square: `d` ahead of the camera, `lat` across the road, `dist` metres into the run. */
export function project(size: number, d: number, lat: number, dist: number): Placed {
  const scale = 1 / (1 + d / 10);
  const swing = bend(dist + d) - bend(dist + VAN_DEPTH);
  return {
    x: size / 2 + (lat + swing) * ROAD_HALF * scale * size,
    y: (HORIZON + (GROUND - HORIZON) * scale) * size,
    scale,
  };
}
