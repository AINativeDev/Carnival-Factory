/**
 * What sits in a square: one of the North Pole's own attractions, a
 * participant's booth, or an open spot waiting for someone to claim it.
 */
export type SlotKind = 'attraction' | 'booth' | 'open';

export interface Point {
  x: number;
  y: number;
}

/**
 * Where a square sits in the town. The town's coordinates are pixels with the
 * centre of the town square at (0, 0), so they never change as the town grows.
 * `x` and `y` are the square's centre and `angle` its turn in radians.
 * `index` is the attraction's or booth's place in its own list, and counts the
 * open spots from 0 too.
 */
export interface Slot {
  kind: SlotKind;
  index: number;
  x: number;
  y: number;
  angle: number;
}

/** A path through the town, as points close enough together to draw as a curve. */
export interface TownPath {
  kind: 'midway' | 'lane' | 'stream';
  width: number;
  points: Point[];
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapLayout {
  slots: Slot[];
  /** The midway first, then the lanes off it, then the frozen stream. */
  paths: TownPath[];
  /** The town square the attractions gather around. */
  plaza: Point & { radius: number };
  /** Where the stream runs under the midway. */
  bridge: Point;
  /** The part of the town worth drawing, scenery around the edge included. */
  bounds: Box;
}

export const SQUARE_SIZE = 160;
/** Room under a square for its sign. */
export const SIGN_HEIGHT = 40;
/** How wide a sign's text may run, centred under its square: no wider than the square. */
export const SIGN_WIDTH = SQUARE_SIZE;
export const MIDWAY_WIDTH = 72;
export const LANE_WIDTH = 48;
export const STREAM_WIDTH = 44;
/** The open spots waiting at the end of the lanes. */
export const OPEN_SPOTS = 3;

/** The town's fixed seed: the same squares always make the same town. */
const SEED = 1225;
/** How far a square turns either way, in radians: about five degrees. */
const MAX_TURN = 0.09;
const PLAZA_RADIUS = 220;
/** Attractions sit in rings around the town square, the first ring this far out. */
const RING_RADIUS = 380;
const RING_STEP = 280;
/** How far each side of a lane its squares sit, centre to centre. */
const LANE_OFFSET = 150;
/** How far a lane's squares reach either side of it, wobble and turn included. */
const LANE_REACH = 300;
/** Between neighbouring columns of lanes. */
const LANE_GAP = 2 * LANE_REACH + 90;
/** How far up a lane its first squares sit, clear of the midway. */
const LANE_START = 240;
const ROW_STEP = 250;
const PATH_STEP = 20;
/** Room for scenery around the edge of the town. */
const MARGIN = 220;

/**
 * A number from 0 to 1 that depends only on its arguments and the town's
 * seed. Every bit of variety in the town comes from here, never from
 * `Math.random()`.
 */
export function hash(...values: number[]): number {
  let h = SEED ^ 0x9e3779b9;
  for (const value of values) {
    h = Math.imul(h ^ Math.round(value * 1000), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return (h >>> 0) / 4294967296;
}

/** A number between -1 and 1, from `hash`. */
const wobble = (...values: number[]) => hash(...values) * 2 - 1;

const smoothstep = (from: number, to: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

/** Where attraction `index` sits: on a ring round the town square, north and south of the midway in turn. */
export function attractionSeat(index: number): Slot {
  let ring = 0;
  let first = 0;
  while (index >= first + 2 * (4 + 2 * ring)) first += 2 * (4 + 2 * ring++);
  const perArc = 4 + 2 * ring;
  const seat = index - first;
  const north = seat % 2 === 0;
  // Each arc spans 30° to 150° round the square, clear of the midway either side.
  const along = Math.PI / 6 + ((Math.floor(seat / 2) + 0.5) / perArc) * ((2 * Math.PI) / 3);
  const radius = RING_RADIUS + ring * RING_STEP + 14 * wobble(index, 1);
  return {
    kind: 'attraction',
    index,
    x: Math.cos(along) * radius,
    y: (north ? -1 : 1) * Math.sin(along) * radius,
    angle: MAX_TURN * wobble(index, 2),
  };
}

/** How far the attractions reach east and west of the town square. */
function attractionReach(attractions: number): number {
  let reach = PLAZA_RADIUS;
  for (let index = 0; index < attractions; index++) {
    reach = Math.max(reach, Math.abs(attractionSeat(index).x) + SQUARE_SIZE / 2 + 20);
  }
  return reach;
}

/** The midway's height at `x`: flat through the town square, winding further out. */
export function midwayY(x: number, calm: number): number {
  const wind = 26 * Math.sin(x / 330 + 1.3) + 12 * Math.sin(x / 190 + 0.4);
  return smoothstep(PLAZA_RADIUS, calm + 120, Math.abs(x)) * wind;
}

/** A lane: where it leaves the midway, which way it runs, and how many squares it holds. */
export interface Lane {
  index: number;
  x: number;
  /** -1 runs north, 1 runs south. */
  direction: number;
  capacity: number;
}

/**
 * Lane `index` of the town. Lanes open in columns out from the town square,
 * east then west, north and south of the midway, so they never cross.
 */
export function laneAt(index: number, calm: number): Lane {
  const column = Math.floor(index / 4);
  const [east, north] = [
    [true, true],
    [false, false],
    [true, false],
    [false, true],
  ][index % 4];
  const firstColumn = calm + STREAM_WIDTH + 2 * 80 + LANE_REACH;
  return {
    index,
    x: (east ? 1 : -1) * (firstColumn + column * LANE_GAP),
    direction: north ? -1 : 1,
    capacity: 6 + 2 * Math.floor(hash(index, 3) * 3),
  };
}

/** How far along a lane (away from the midway) spot `spot` sits. */
function spotDistance(lane: Lane, spot: number): number {
  let distance = LANE_START;
  for (let row = 1; row <= Math.floor(spot / 2); row++) {
    // Most rows sit close together, and now and then a lane leaves a gap.
    distance +=
      ROW_STEP + 30 * hash(lane.index, row, 4) + (hash(lane.index, row, 5) < 0.2 ? 130 : 0);
  }
  // The squares on the far side of the lane sit a little further along.
  return distance + (spot % 2) * 70;
}

/** Where a lane is at distance `distance` from the midway. */
export function lanePoint(lane: Lane, distance: number, calm: number): Point {
  const sway = 32 * Math.sin(distance / (190 + 60 * hash(lane.index, 6)) + 6 * hash(lane.index, 7));
  return {
    x: lane.x + Math.min(1, distance / 200) * sway,
    y: midwayY(lane.x, calm) + lane.direction * distance,
  };
}

function laneSpot(lane: Lane, spot: number, calm: number): Point & { angle: number } {
  const at = lanePoint(lane, spotDistance(lane, spot), calm);
  const side = spot % 2 ? 1 : -1;
  return {
    x: at.x + side * (LANE_OFFSET + 14 * hash(lane.index, spot, 8)),
    y: at.y + 10 * wobble(lane.index, spot, 9),
    angle: MAX_TURN * wobble(lane.index, spot, 10),
  };
}

/** How long a lane runs: past its last square, to a little turning circle. */
function laneLength(lane: Lane): number {
  return spotDistance(lane, lane.capacity - 1) + 170;
}

function sample(from: number, to: number, at: (t: number) => Point): Point[] {
  const steps = Math.max(1, Math.ceil(Math.abs(to - from) / PATH_STEP));
  return Array.from({ length: steps + 1 }, (_, i) => at(from + ((to - from) * i) / steps));
}

/** The box a square and its sign take up, turned about the square's centre as they are drawn. */
export function footprint(slot: Slot): Box {
  const half = SQUARE_SIZE / 2;
  const corners = [
    [-half, -half],
    [half, -half],
    [-SIGN_WIDTH / 2, half + SIGN_HEIGHT],
    [SIGN_WIDTH / 2, half + SIGN_HEIGHT],
    [-SIGN_WIDTH / 2, half],
    [SIGN_WIDTH / 2, half],
  ];
  const [cos, sin] = [Math.cos(slot.angle), Math.sin(slot.angle)];
  const xs = corners.map(([x, y]) => slot.x + x * cos - y * sin);
  const ys = corners.map(([x, y]) => slot.y + x * sin + y * cos);
  const [left, top] = [Math.min(...xs), Math.min(...ys)];
  return { x: left, y: top, width: Math.max(...xs) - left, height: Math.max(...ys) - top };
}

/**
 * Lays the North Pole out as a little town. The attractions gather round the
 * town square, and the midway winds out of it east and west. Lanes branch off
 * the midway, and the booths make little neighbourhoods along them, a few
 * open spots waiting at the end.
 *
 * Everything comes from the fixed seed and the order of the squares. The
 * attractions' places depend only on the attractions, and booth spots are
 * filled lane by lane in a fixed order, so adding a booth never moves an
 * attraction or an earlier booth: the new one takes the next free spot, and a
 * new lane opens when the last one is full.
 */
export function layoutMap(attractions: number, booths: number): MapLayout {
  const slots: Slot[] = [];
  for (let index = 0; index < attractions; index++) slots.push(attractionSeat(index));

  const calm = attractionReach(attractions);
  const lanes: Lane[] = [];
  for (let index = 0, lane = laneAt(0, calm), spot = 0; index < booths + OPEN_SPOTS; index++) {
    if (spot === lane.capacity) [lane, spot] = [laneAt(lane.index + 1, calm), 0];
    if (spot === 0) lanes.push(lane);
    const open = index >= booths;
    slots.push({
      kind: open ? 'open' : 'booth',
      index: open ? index - booths : index,
      ...laneSpot(lane, spot++, calm),
    });
  }

  const reach = Math.max(...lanes.map((lane) => Math.abs(lane.x))) + LANE_REACH + 80;
  const midway: TownPath = {
    kind: 'midway',
    width: MIDWAY_WIDTH,
    points: sample(-reach, reach, (x) => ({ x, y: midwayY(x, calm) })),
  };
  const lanePaths: TownPath[] = lanes.map((lane) => ({
    kind: 'lane',
    width: LANE_WIDTH,
    points: sample(0, laneLength(lane), (distance) => lanePoint(lane, distance, calm)),
  }));

  let top = -PLAZA_RADIUS;
  let bottom = PLAZA_RADIUS;
  for (const box of slots.map(footprint)) {
    top = Math.min(top, box.y);
    bottom = Math.max(bottom, box.y + box.height);
  }
  for (const path of lanePaths) {
    for (const { y } of path.points) [top, bottom] = [Math.min(top, y), Math.max(bottom, y)];
  }
  top -= MARGIN;
  bottom += MARGIN;

  // The stream runs north to south between the attractions and the first lanes, west of the square.
  const streamX = -(calm + STREAM_WIDTH / 2 + 70);
  const stream: TownPath = {
    kind: 'stream',
    width: STREAM_WIDTH,
    points: sample(top, bottom, (y) => ({
      x: streamX + 22 * Math.sin(y / 170 + 0.8) * smoothstep(0, 200, Math.abs(y)),
      y,
    })),
  };

  return {
    slots,
    paths: [midway, ...lanePaths, stream],
    plaza: { x: 0, y: 0, radius: PLAZA_RADIUS },
    bridge: { x: streamX, y: midwayY(streamX, calm) },
    bounds: { x: -reach - MARGIN, y: top, width: 2 * (reach + MARGIN), height: bottom - top },
  };
}

/** Whether `point` is inside `slot`'s square, turned as it is. */
export function insideSlot(slot: Slot, x: number, y: number): boolean {
  const [dx, dy] = [x - slot.x, y - slot.y];
  const [cos, sin] = [Math.cos(slot.angle), Math.sin(slot.angle)];
  const half = SQUARE_SIZE / 2;
  return Math.abs(dx * cos + dy * sin) <= half && Math.abs(-dx * sin + dy * cos) <= half;
}

/** The slot under a point in the town, if any, at its actual place and turn. */
export function slotAt(layout: MapLayout, x: number, y: number): Slot | undefined {
  return layout.slots.find((slot) => insideSlot(slot, x, y));
}

/** The distance from `point` to the middle of `path`. */
export function distanceToPath(path: TownPath, point: Point): number {
  let best = Infinity;
  const { points } = path;
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    const [dx, dy] = [b.x - a.x, b.y - a.y];
    const length = dx * dx + dy * dy;
    const t = length
      ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length))
      : 0;
    best = Math.min(best, Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy));
  }
  return best;
}

/** The distance from `point` to the nearest edge of `box`, 0 inside it. */
export function distanceToBox(box: Box, point: Point): number {
  const dx = Math.max(box.x - point.x, 0, point.x - box.x - box.width);
  const dy = Math.max(box.y - point.y, 0, point.y - box.y - box.height);
  return Math.hypot(dx, dy);
}

export type SceneryKind = 'tree' | 'drift' | 'fence' | 'lamp';

export interface SceneryItem extends Point {
  kind: SceneryKind;
  /** A number from 0 to 1 for the item's own size and twinkle. */
  seed: number;
}

/**
 * The circle that holds everything solid `drawTree`, `drawDrift`, `drawFence`
 * and `drawLamp` in `map.ts` paint for `item`. A lamp's soft glow is left out,
 * as it is meant to spill onto the path.
 */
export function sceneryExtent(item: SceneryItem): Point & { radius: number } {
  if (item.kind === 'tree') {
    // The tree reaches from 35 above its anchor to 18 below, 22 either side, at its scale.
    const scale = 0.8 + 0.5 * item.seed;
    return { x: item.x, y: item.y - 8.5 * scale, radius: 34.5 * scale };
  }
  if (item.kind === 'drift') return { x: item.x, y: item.y, radius: 22 + 10 * item.seed };
  if (item.kind === 'fence') return { x: item.x, y: item.y, radius: 34 };
  // The lamp's head is 26 above its anchor, and its foot 3 below.
  return { x: item.x, y: item.y - LAMP_LIFT, radius: LAMP_RADIUS };
}

const LAMP_LIFT = 11.5;
const LAMP_RADIUS = 15.5;
const CELL = 100;

/**
 * The trees, drifts, fences and lamps between the squares. Each comes from a
 * fixed cell of the town and the seed, and is only kept where all it paints is
 * clear of every square, sign, path and the town square, so the squares stay
 * the stars.
 */
export function placeScenery(layout: MapLayout): SceneryItem[] {
  const boxes = layout.slots.map(footprint);
  const clear = (item: SceneryItem) => {
    const { radius: room, ...at } = sceneryExtent(item);
    if (Math.hypot(at.x - layout.plaza.x, at.y - layout.plaza.y) < layout.plaza.radius + room)
      return false;
    if (Math.hypot(at.x - layout.bridge.x, at.y - layout.bridge.y) < 80 + room) return false;
    if (boxes.some((box) => distanceToBox(box, at) < room + 14)) return false;
    return layout.paths.every((path) => distanceToPath(path, at) > path.width / 2 + room + 6);
  };

  const items: SceneryItem[] = [];
  // Lamps along the midway and up each lane, on alternating sides.
  for (const path of layout.paths.filter((path) => path.kind !== 'stream')) {
    const every = path.kind === 'midway' ? 16 : 12;
    for (let i = every / 2, n = 0; i < path.points.length - 1; i += every, n++) {
      const [a, b] = [path.points[i], path.points[i + 1]];
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const normal = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
      // Far enough out that the lamp's head clears the path, whichever way the path runs.
      const side = (n % 2 ? 1 : -1) * (path.width / 2 + LAMP_RADIUS + 3) + LAMP_LIFT * normal.y;
      const lamp: SceneryItem = {
        kind: 'lamp',
        x: a.x + normal.x * side,
        y: a.y + normal.y * side,
        seed: hash(a.x, a.y, 11),
      };
      const at = sceneryExtent(lamp);
      const onPlaza =
        Math.hypot(at.x - layout.plaza.x, at.y - layout.plaza.y) < layout.plaza.radius + 20;
      const onBridge = Math.hypot(at.x - layout.bridge.x, at.y - layout.bridge.y) < 80;
      if (
        !onPlaza &&
        !onBridge &&
        boxes.every((box) => distanceToBox(box, at) > at.radius + 2) &&
        layout.paths.every((path) => distanceToPath(path, at) > path.width / 2 + at.radius)
      )
        items.push(lamp);
    }
  }

  const { bounds } = layout;
  for (let cy = Math.floor(bounds.y / CELL); cy * CELL < bounds.y + bounds.height; cy++) {
    for (let cx = Math.floor(bounds.x / CELL); cx * CELL < bounds.x + bounds.width; cx++) {
      const roll = hash(cx, cy, 12);
      const kind: SceneryKind | undefined =
        roll < 0.5 ? 'tree' : roll < 0.62 ? 'drift' : roll < 0.67 ? 'fence' : undefined;
      if (!kind) continue;
      const item: SceneryItem = {
        kind,
        x: (cx + 0.2 + 0.6 * hash(cx, cy, 13)) * CELL,
        y: (cy + 0.2 + 0.6 * hash(cx, cy, 14)) * CELL,
        seed: hash(cx, cy, 15),
      };
      if (clear(item)) items.push(item);
    }
  }
  // Drawn from the top down, so nearer things overlap further ones.
  return items.sort((a, b) => a.y - b.y);
}
