/**
 * What the page can ask of a running map: walk or jump to a square, pick one
 * or let it go, go inside and out, show the construction sites, and the whole
 * island. Kept apart from the map's frame and input, which are what the
 * visitor does; these are what the page's panels and routes do.
 */
import { islandBounds, islandCorners } from './camera';
import { ENTRANCE } from './interior';
import { resize } from './map-layers';
import { plotOf } from './map-labels';
import { named, select } from './map-open';
import type { MapControls } from './map-options';
import { islandBox, replan } from './map-plan';
import type { MapRun } from './map-state';
import { walkToward } from './map-walk';
import { faceOf } from './faces';
import { nearYou, nearestOpenPlot } from './visit';
import { type Plot } from './world';
import { plotAtDoor } from './walking';
import { nearestStand } from './walking';

/** The controls for a running map; `stop` stops its frames and lets go of the page. */
export function mapControls(m: MapRun, stop: () => void): MapControls {
  const leaveFirst = () => {
    if (m.visiting) m.options.onLeave();
  };
  return {
    stop,
    walkTo(kind, id) {
      leaveFirst();
      const plot = plotOf(m, kind, id);
      if (!plot) return;
      select(m, plot);
      m.selectedAt = undefined;
      walkToward(m, [plot.door]);
      m.trailing = m.path.length > 0;
      m.footprints = [];
    },
    jumpTo(kind, id) {
      const plot = plotOf(m, kind, id);
      if (!plot) return;
      leaveFirst();
      m.player = { ...plot.door };
      m.path = [];
      backToCarnival(m);
      // The camera comes in on the square, and eases back out a little later, as after a walk.
      m.walking = 1;
      m.movedAt = performance.now();
      select(m, plot);
      m.selectedAt = undefined;
    },
    get selected() {
      return m.selected && named(m.selected);
    },
    clearSelection() {
      select(m, undefined);
    },
    nearest(count) {
      const squares = m.world.plots.filter(
        (plot) => plot.kind === 'booth' || plot.kind === 'attraction',
      );
      return nearYou(squares, m.player, count).map(named);
    },
    setMe(login) {
      m.me = login;
    },
    setPending(list) {
      // A site's tag says its stage, which may have changed.
      m.tagged = undefined;
      if (!replan(m, list)) return;
      // Which construction sites are up, for the smoke test.
      m.canvas.dataset.sites = this.sites.join(' ');
      keepHold(m);
    },
    get sites() {
      // A construction site's id is the login it's being built for.
      return m.world.plots.filter((plot) => plot.kind === 'site').map((plot) => String(plot.id));
    },
    walkToOpenPlot() {
      leaveFirst();
      const way = nearestOpenPlot(m.world, m.player);
      if (!way) return;
      // The open plot is where they're headed now, so its call to action is the one that shows.
      select(m, undefined);
      m.path = way.path;
    },
    claimNextDoor() {
      const way = nearestOpenPlot(m.world, m.player);
      if (!way) return;
      select(m, undefined);
      m.path = way.path;
      m.claiming = way.plot;
      m.footprints = [];
    },
    visit: (kind, id) => visit(m, kind, id),
    leave() {
      const { visiting } = m;
      if (!visiting) return;
      // Out just in front of the door, facing out, with the camera where it was.
      m.player = { ...visiting.door };
      m.path = [];
      m.facing = Math.sign(faceOf(visiting).out.x);
      m.visiting = undefined;
      m.held.clear();
      m.fading = performance.now();
      delete m.frame.dataset.visiting;
    },
    get visiting() {
      return m.visiting && named(m.visiting);
    },
    toggleOverview() {
      m.overview = !m.overview;
      m.panned = undefined;
      m.chosen = undefined;
      return m.overview;
    },
    get overview() {
      return m.overview;
    },
  };
}

/** The camera goes back to the carnival from the overview, or from where a finger left it. */
function backToCarnival(m: MapRun) {
  // A zoom chosen in the overview was nearer than the overview, not than the carnival.
  if (m.overview) m.chosen = undefined;
  m.overview = false;
  m.panned = undefined;
}

/** Takes the player inside a square, with a short fade. Returns whether it's there. */
function visit(m: MapRun, kind: string, id: string) {
  const plot = m.world.plots.find((p) => p.kind === kind && p.id === id);
  if (!plot) return false;
  if (m.visiting === plot) return true;
  // The player goes in at the door, and whatever walk they were on ends there.
  if (plotAtDoor(m.world, m.player) !== plot) m.player = { ...plot.door };
  m.path = [];
  m.claiming = undefined;
  m.held.clear();
  backToCarnival(m);
  if (!m.visiting) m.fading = performance.now();
  m.visiting = plot;
  select(m, undefined);
  m.inside = { ...ENTRANCE };
  m.insideGoal = undefined;
  m.insideFacing = 1;
  m.hovered = undefined;
  m.frame.dataset.visiting = `${kind}:${id}`;
  return true;
}

/**
 * The world was laid out again, and its plots are new objects: keeps hold of
 * the same squares in it, puts the player on clear ground in case a new site
 * stands where they are, plans what's left of their walk again, and redraws
 * the island.
 */
function keepHold(m: MapRun) {
  const same = (plot: Plot | undefined) =>
    plot &&
    m.world.plots.find(
      (p) => p.kind === plot.kind && p.id === plot.id && (p.id || p.number === plot.number),
    );
  m.selected = same(m.selected);
  m.near = same(m.near);
  m.hovered = same(m.hovered);
  m.claiming = same(m.claiming);
  m.invited = same(m.invited);
  if (m.visiting) m.visiting = same(m.visiting);
  if (m.entered) m.entered = same(m.entered);
  m.player = nearestStand(m.world, m.player);
  const goal = m.path.at(-1);
  m.path = [];
  if (goal) walkToward(m, [goal]);
  m.island = islandCorners(m.world);
  m.bounds = islandBounds(m.world);
  m.groundBox = islandBox(m.island);
  m.targets = [];
  resize(m);
}
