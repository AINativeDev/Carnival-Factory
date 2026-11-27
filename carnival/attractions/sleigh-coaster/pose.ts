/**
 * Where the sleigh is drawn and how it's tilted: on the near rail with the
 * track's slope, nosing along its arc in the air, or tumbling head over heels
 * into the snowdrift in front of the track once it has flown off the rails.
 * Plain functions, so the drawing's placing is tested without a canvas.
 */
import { type Coaster, TUMBLE } from './game';
import { heightOf } from './physics';
import { NEAR, onScreen } from './scenery';
import { trackAt } from './track';

/** The sleigh on screen: where, its tilt in radians, and whether the riders' hands are up. */
export interface Pose {
  x: number;
  y: number;
  angle: number;
  up: boolean;
}

/** How steeply the track must fall under the sleigh for the riders' hands to go up. */
const DROP = 0.6;
/** How far above the drift's middle the upside-down sleigh's runners end up, the rest of it in the snow. */
const BURIED = 8;
/** The steepest the sleigh noses up or down in the air. */
const STEEPEST = 0.9;

/** How far through its tumble into the snow the sleigh is at `time`, from 0 to 1. */
export function tumbled(coaster: Coaster, time: number): number {
  if (!coaster.sleigh.off || coaster.ended === null) return 0;
  return Math.min(1, Math.max(0, (time - coaster.ended) / TUMBLE));
}

/** Where the snowdrift the sleigh tumbles into is, on screen, in front of the track. */
export function driftOf(coaster: Coaster, cam: number) {
  return onScreen(coaster.sleigh.x + 18, 0, cam, NEAR + 2, 99);
}

/** The sleigh's pose at `time`, with the camera's left edge at `cam`. */
export function poseOf(coaster: Coaster, cam: number, time: number): Pose {
  const { sleigh } = coaster;
  const from = onScreen(sleigh.x, heightOf(sleigh), cam, NEAR);
  if (sleigh.off && coaster.ended !== null) {
    // Up off the rail, head over heels, and upside down into the drift.
    const t = tumbled(coaster, time);
    const to = driftOf(coaster, cam);
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - BURIED - from.y) * t * t - Math.sin(t * Math.PI) * 10,
      angle: t * Math.PI * 3,
      up: true,
    };
  }
  const { air } = sleigh;
  if (air) {
    const angle = -Math.atan2(air.vy, Math.abs(air.vx));
    return { ...from, angle: Math.max(-STEEPEST, Math.min(STEEPEST, angle)), up: true };
  }
  const { slope } = trackAt(sleigh.x);
  return { ...from, angle: -Math.atan(slope), up: slope < -DROP };
}
