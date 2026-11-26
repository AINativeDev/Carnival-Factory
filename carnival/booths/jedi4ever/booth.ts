/**
 * North Pole Night Run: puts the street, the traffic and the van together
 * back to front, steers the van from the pointer (or the autopilot when nobody
 * is), and keeps the run and the best of this visit as the booth's one memory.
 */
import { drawLighting, drawNoir } from './lighting';
import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { drawDashboard } from './dashboard';
import { autopilotTarget } from './autopilot';
import { advance, newRun, restart, type Run } from './game';
import { drawSky, drawSkyline } from './sky';
import { drawPuff, drawSnowfall, drawSparkles } from './snow';
import { drawRoad, drawTrails, roadside, type Roadside } from './street';
import { drawDeliveryVan, drawParcel, drawTraffic } from './vehicles';
import { FAR, project, VAN_DEPTH } from './view';

/** Who is steering, towards where and until when, and where the pointer was last frame. */
interface Steering {
  target: number;
  until: number;
  lastX: number;
}

/** The run in progress, when the last frame was, and who is steering. */
let run: Run = newRun(1);
let lastTime = Number.NaN;
let steering: Steering = { target: 0, until: -Infinity, lastX: Number.NaN };
let runs = 1;

/** Where the pointer wants the van: its side of the square, or a half-turn on a tap. */
export function steerFrom(pointer: SquarePointer, size: number, vanX: number): number {
  if (pointer.presses > 0) return vanX + (pointer.x < size / 2 ? -0.55 : 0.55);
  return (pointer.x / size - 0.5) * 2;
}

/**
 * The steering after this frame's pointer. A pointer that hasn't moved keeps
 * the turn it set, so a tap's half-turn isn't undone by the frames that keep
 * reporting the finger where it tapped.
 */
export function steerWith(
  prev: Steering,
  pointer: SquarePointer,
  size: number,
  vanX: number,
  time: number,
): Steering {
  const fresh = pointer.presses > 0 || pointer.x !== prev.lastX;
  const target = fresh ? steerFrom(pointer, size, vanX) : prev.target;
  return { target, until: time + 1500, lastX: pointer.x };
}

/**
 * The steps, in seconds, that play `ms` between frames: none small enough to
 * jump past a car or a parcel, and none at all past a second, which is a
 * pause rather than driving.
 */
export function frameSteps(ms: number): number[] {
  const elapsed = Number.isNaN(ms) ? 0 : Math.max(0, Math.min(1, ms / 1000));
  const count = Math.ceil(elapsed / 0.05);
  return Array.from({ length: count }, () => elapsed / count);
}

/** The traffic, parcels and roadside, sorted far to near. */
function sorted(size: number, state: Run): Roadside[] {
  const scenery = roadside(size, state.dist);
  for (const car of state.traffic) {
    const d = VAN_DEPTH + car.z;
    if (d < 1 || d > FAR) continue;
    const at = project(size, d, car.x, state.dist);
    scenery.push({
      d,
      paint: (ctx) => {
        drawTraffic(ctx, car.kind, at.x, at.y, 0.4 * 0.62 * at.scale * size);
      },
    });
  }
  for (const parcel of state.parcels) {
    const d = VAN_DEPTH + parcel.z;
    if (d < 1 || d > FAR) continue;
    const at = project(size, d, parcel.x, state.dist);
    const bob = 0.1 + 0.1 * Math.sin(state.time * 4 + parcel.z);
    scenery.push({
      d,
      paint: (ctx) => {
        drawParcel(ctx, at.x, at.y, 0.3 * 0.62 * at.scale * size, bob);
      },
    });
  }
  return scenery.sort((a, b) => b.d - a.d);
}

/** A north pole night run: a driving game that plays itself on the stall's front. */
const booth: NorthPoleSquare = {
  id: 'jedi4ever',
  name: 'North Pole Night Run',
  description:
    'Drive a little red delivery van down a snowy street at dusk, weaving through traffic for parcels.',
  stall: { shape: 'food-truck', roof: 'berry', trim: 'gold' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    const steps = frameSteps(time - lastTime);
    lastTime = time;
    if (pointer) {
      steering = steerWith(steering, pointer, size, run.van.x, time);
      if (pointer.presses > 0 && run.crashed && run.crashTime > 0.6) {
        runs += 1;
        run = restart(run, runs);
      }
    } else {
      steering = { ...steering, lastX: Number.NaN };
      if (run.crashed && run.crashTime > (steering.until > time ? 6 : 2.5)) {
        runs += 1;
        run = restart(run, runs);
      }
    }
    for (const dt of steps) {
      run = advance(run, dt, steering.until > time ? steering.target : autopilotTarget(run));
    }

    drawSky(ctx, size, time);
    drawSkyline(ctx, size, run.dist);
    drawRoad(ctx, size, run.dist);
    const here = project(size, VAN_DEPTH, run.van.x, run.dist);
    const w = 0.4 * 0.62 * here.scale * size;
    drawTrails(ctx, size, run.trails, run.dist);
    const tilt = run.crashed ? Math.min(run.crashTime * 3, 2.5) : run.van.slide;
    const scenery = sorted(size, run);
    let vanDrawn = false;
    for (const piece of scenery) {
      if (!vanDrawn && piece.d < VAN_DEPTH) {
        drawDeliveryVan(ctx, here.x, here.y, w, run.van.vx, tilt);
        vanDrawn = true;
      }
      piece.paint(ctx);
    }
    if (!vanDrawn) drawDeliveryVan(ctx, here.x, here.y, w, run.van.vx, tilt);
    // Noir: the street in black and white, and the van alone in its red.
    drawNoir(ctx, size);
    drawDeliveryVan(ctx, here.x, here.y, w, run.van.vx, tilt);
    if (run.crashed) drawPuff(ctx, here.x, here.y, size, run.crashTime);
    for (const burst of run.sparks)
      drawSparkles(ctx, here.x, here.y - w, size, run.time - burst.at);
    drawLighting(ctx, size, here.x, here.y, w);
    drawSnowfall(ctx, size, time, run.dist, run.van.speed);
    drawDashboard(
      ctx,
      size,
      { speed: run.van.speed, score: run.score, best: run.best },
      run.crashed && run.crashTime > 0.6,
    );
  },
};

export default booth;
