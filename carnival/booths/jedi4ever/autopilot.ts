/**
 * The autopilot that plays the stall's front when nobody is steering: it
 * looks down the road for the clearest line, and leans towards parcels.
 */
import { halfWidth, SIDE_LIMIT, VAN_HALF, type Run } from './game';

/** Where the autopilot steers: the clear line through the traffic that picks up parcels. */
export function autopilotTarget(run: Run): number {
  let bestX = 0;
  let bestCost = Infinity;
  for (let x = -SIDE_LIMIT; x <= SIDE_LIMIT + 1e-9; x += 0.05) {
    let cost = Math.abs(x - run.van.x) * 0.4 + Math.abs(x) * 0.2;
    for (const car of run.traffic) {
      if (car.z < -3 || car.z > 90) continue;
      const room = Math.abs(x - car.x) - halfWidth(car.kind) - VAN_HALF;
      if (room < 0.18) cost += 200 / (1 + car.z * 0.04);
    }
    for (const parcel of run.parcels) {
      if (parcel.z > 0 && parcel.z < 60 && Math.abs(x - parcel.x) < 0.12) cost -= 1.5;
    }
    if (cost < bestCost) {
      bestCost = cost;
      bestX = x;
    }
  }
  return bestX;
}
