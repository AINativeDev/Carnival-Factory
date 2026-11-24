/**
 * What sits in a square: one of the North Pole's own attractions, a
 * participant's booth, or an open spot waiting for someone to claim it.
 */
export type SlotKind = 'attraction' | 'booth' | 'open';

/**
 * Where a square sits on the map, in pixels from the map's top-left corner.
 * `index` is the attraction's or booth's place in its own list, and counts the
 * open spots from 0 too.
 */
export interface Slot {
  kind: SlotKind;
  index: number;
  x: number;
  y: number;
}

export interface MapLayout {
  slots: Slot[];
  /** The midway path that runs down the middle of the map. */
  midway: { x: number; width: number };
  width: number;
  height: number;
}

export const SQUARE_SIZE = 160;
/** Room around each square for the snow and its sign. */
export const GUTTER = 48;
/** The width of the midway path. */
export const MIDWAY = 64;

const STEP = SQUARE_SIZE + GUTTER;

/** How many squares fit on each side of the midway in `maxWidth`, at least one. */
export function sidesFor(maxWidth: number): number {
  return Math.max(1, Math.floor((maxWidth - 2 * GUTTER - MIDWAY) / (2 * STEP)));
}

/** A square's place: its row, which side of the midway, and how far out from it. */
interface Spot {
  row: number;
  side: 'left' | 'right';
  out: number;
}

/**
 * The squares beside the midway that booths fill, in order: row by row from
 * the top, nearest the midway first, left before right, skipping the squares
 * the attractions take. The order depends only on the attractions and the
 * width, never on how many booths there are, so a new booth never moves one.
 */
function* boothSpots(sides: number, attractions: number): Generator<Spot> {
  for (let row = 0; ; row++) {
    for (let out = 0; out < sides; out++) {
      for (const side of ['left', 'right'] as const) {
        if (out === 0 && 2 * row + (side === 'left' ? 0 : 1) < attractions) continue;
        yield { row, side, out };
      }
    }
  }
}

/**
 * Lays the map out as a carnival midway: a path down the middle with the
 * attractions in pairs on either edge of it, and participants' booths lined up
 * beside them like booths, then below them once the attractions' rows are
 * full. The rest of the last row, and at least one square, is open for a new
 * booth.
 *
 * Attractions sit in the same squares however many booths there are, and each
 * booth keeps its square when a booth is added after it, so adding a booth never
 * moves anything but the booths that sort after it, by one square.
 */
export function layoutMap(attractions: number, booths: number, maxWidth: number): MapLayout {
  const sides = sidesFor(maxWidth);
  const midwayX = GUTTER + sides * STEP;
  const spotX = ({ side, out }: Spot) =>
    side === 'left' ? midwayX - (out + 1) * STEP : midwayX + MIDWAY + GUTTER + out * STEP;
  const spotY = ({ row }: Spot) => GUTTER + row * STEP;

  const slots: Slot[] = [];
  for (let index = 0; index < attractions; index++) {
    const spot: Spot = { row: Math.floor(index / 2), side: index % 2 ? 'right' : 'left', out: 0 };
    slots.push({ kind: 'attraction', index, x: spotX(spot), y: spotY(spot) });
  }

  // Every booth, then open spots to the end of the last row with anything in it.
  const spots = boothSpots(sides, attractions);
  let rows = Math.ceil(attractions / 2);
  for (let index = 0; ; index++) {
    const spot = spots.next().value as Spot;
    if (index > booths && spot.row >= rows) break;
    const open = index >= booths;
    rows = Math.max(rows, spot.row + 1);
    slots.push({
      kind: open ? 'open' : 'booth',
      index: open ? index - booths : index,
      x: spotX(spot),
      y: spotY(spot),
    });
  }

  return {
    slots,
    midway: { x: midwayX, width: MIDWAY },
    width: 2 * GUTTER + 2 * sides * STEP + MIDWAY,
    height: GUTTER + rows * STEP,
  };
}

/** The slot under a point on the map, if any. */
export function slotAt(layout: MapLayout, x: number, y: number): Slot | undefined {
  return layout.slots.find(
    (slot) => x >= slot.x && x < slot.x + SQUARE_SIZE && y >= slot.y && y < slot.y + SQUARE_SIZE,
  );
}
