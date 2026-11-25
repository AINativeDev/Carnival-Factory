/**
 * What a laptop's camera keeps in view while the player stands still: them, and
 * the free spot nearest them with its sign, so the invitation to get a booth is
 * on screen from the start, however close the camera rests (camera.ts).
 */
import { tilesOnScreen, union } from './camera';
import { toScreen, type Box, type Tile, type World } from './world';

/** How far a free spot's "Free spot" sign rises over its plot, in world pixels. */
const SIGN_HEADROOM = 150;

/**
 * What a laptop's resting view must keep in sight: the player, and the free
 * spot nearest them with its sign, so the invitation to get a booth is always
 * on screen. Without a free spot, the player alone.
 */
export function restingFocus(world: World, player: Tile): Box {
  const at = toScreen(player);
  const me = { x: at.x - 48, y: at.y - 120, w: 96, h: 150 };
  const spots = world.plots.filter((plot) => plot.kind === 'open');
  const distance = (plot: Box) => Math.hypot(plot.x - player.x, plot.y - player.y);
  const nearest = spots.reduce<Box | undefined>(
    (best, plot) => (!best || distance(plot) < distance(best) ? plot : best),
    undefined,
  );
  if (!nearest) return me;
  const spot = tilesOnScreen(nearest);
  return union([me, { ...spot, y: spot.y - SIGN_HEADROOM, h: spot.h + SIGN_HEADROOM }]);
}
