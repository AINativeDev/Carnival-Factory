/**
 * Laying out the world the map walks: the North Pole's spots from its squares,
 * the pins and the booths being built, or a level's own world, and the box the
 * island's cached layers cover. Kept apart from the map's running code because
 * the world is laid out again whenever the construction sites change.
 */
import { boothSpotFiles } from './booths';
import { SLAB, type islandCorners } from './camera';
import type { MapOptions } from './map-options';
import { WALL } from './room';
import type { MapRun } from './map-state';
import pinned from './spots.json';
import { type PendingBooth } from './construction-sites';
import { type Box, type World } from './world';
import { buildWorld } from './world-build';
import { isOffMap } from './off-map';

/** The world for these options and booth requests: a level's own, or the North Pole's. */
export function layWorld(options: MapOptions, list: readonly PendingBooth[]): World {
  const levels = options.levels?.map((l) => l.login);
  return (
    options.level?.world ??
    buildWorld(
      // An off-map attraction has its way in already on the map, not a stall (off-map.ts).
      options.attractions.map((square) => square.id).filter((id) => !isOffMap(id)),
      options.booths.map((square) => square.id),
      pinned,
      { files: boothSpotFiles, pending: list, ...(levels && { levels }) },
    )
  );
}

/** Which spot is where, in a line, so a world whose spots haven't moved isn't laid out again. */
export const layoutOf = (world: World) =>
  world.spots.map((spot) => `${spot.kind}:${spot.id ?? ''}:${spot.number}`).join();

/** Takes in new booth requests, and lays the world out again if a spot moved. Returns whether one did. */
export function replan(m: MapRun, list: readonly PendingBooth[]) {
  m.pending = new Map(list.map((entry) => [entry.login, entry]));
  const made = layWorld(m.options, list);
  const plan = layoutOf(made);
  if (plan === m.layout) return false;
  m.layout = plan;
  m.world = made;
  return true;
}

/** The box the island's cached layers cover: the island, its slab and the fence's lights, or an indoor level's back walls. */
export const islandBox = (island: ReturnType<typeof islandCorners>, indoor = false): Box => {
  const above = indoor ? WALL.high + 12 : 40;
  return {
    x: island.left.x - 8,
    y: island.top.y - above,
    w: island.right.x - island.left.x + 16,
    h: island.bottom.y + SLAB + 80 - (island.top.y - above),
  };
};
