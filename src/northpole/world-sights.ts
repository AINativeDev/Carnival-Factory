/**
 * The North Pole's own sights, past the attractions between each avenue and
 * the next quarter's lanes, one quarter each: the frozen pond and its stream,
 * the reindeer's stable and paddock, the log cabins, the ferris wheel and the
 * striped tents. And the pine forest that grows wherever nothing was kept
 * clear. It's apart from the town (`world-town.ts`) because the sights stand
 * the same however many booths there are, only further out.
 */
import type { Groundwork } from './groundwork';
import { hash, key, turnBox, type Box } from './world';

/** Where the skaters and the reindeer go round. */
export interface Sights {
  pond: Box;
  paddock: Box;
}

/** The frozen pond, and the stream running from it under a wooden bridge. */
function layPond(work: Groundwork, sights: number): Box {
  const pond = turnBox({ x: 5, y: sights, w: 5, h: 4 }, 0);
  work.lay(pond, 'ice');
  work.keep(pond, 1);
  work.lay({ x: 7, y: sights + 4, w: 1, h: 10 }, 'water');
  work.lay({ x: 7, y: sights + 8, w: 1, h: 1 }, 'bridge');
  work.lay({ x: 3, y: sights + 8, w: 11, h: 1 }, 'path');
  work.keep({ x: 6, y: sights + 4, w: 3, h: 10 });
  return pond;
}

/** The reindeer's stable, and their paddock fenced in beside it. */
function layStable(work: Groundwork, sights: number): Box {
  work.place('stable', turnBox({ x: 5, y: sights, w: 4, h: 3 }, 1));
  const fenced = { x: 4, y: sights + 4, w: 8, h: 5 };
  const paddock = turnBox({ x: 5, y: sights + 5, w: 6, h: 3 }, 1);
  for (let x = fenced.x; x < fenced.x + fenced.w; x++)
    for (let y = fenced.y; y < fenced.y + fenced.h; y++) {
      const edge =
        x === fenced.x ||
        y === fenced.y ||
        x === fenced.x + fenced.w - 1 ||
        y === fenced.y + fenced.h - 1;
      if (edge) work.place('fence', turnBox({ x, y, w: 1, h: 1 }, 1));
    }
  work.keep(paddock);
  return paddock;
}

/**
 * Lays the sights, whose first row is `sights` tiles out: the pond, the
 * stable, the log cabins (two quarters' worth), the ferris wheel rising over
 * the back of the town, and the striped tents.
 */
export function laySights(work: Groundwork, sights: number): Sights {
  const pond = layPond(work, sights);
  const paddock = layStable(work, sights);
  for (const quarter of [1, 2, 3]) work.keep(turnBox({ x: 4, y: sights - 1, w: 9, h: 1 }, quarter));

  for (const [quarter, x, y] of [
    [2, 5, 0],
    [2, 9, 1],
    [2, 6, 5],
    [3, 5, 0],
    [3, 9, 4],
  ] as const) {
    work.place('cabin', turnBox({ x, y: sights + y, w: 3, h: 3 }, quarter));
    work.keep(turnBox({ x, y: sights + y + 3, w: 3, h: 1 }, quarter));
  }

  work.place('wheel', turnBox({ x: 5, y: sights + 5, w: 3, h: 3 }, 3));
  for (const quarter of [1, 3])
    work.place('tent', turnBox({ x: 10, y: sights, w: 2, h: 2 }, quarter));
  work.place('tent', turnBox({ x: 10, y: sights + 6, w: 2, h: 2 }, 2));
  return { pond, paddock };
}

/**
 * The pine forest: scattered through the town, and thick in the last `forest`
 * tiles round its edge, with snowdrifts here and there.
 */
export function growForest(work: Groundwork, extent: number, forest: number): void {
  const town = extent - forest;
  for (let x = -extent; x <= extent; x++)
    for (let y = -extent; y <= extent; y++) {
      if (work.kept.has(key(x, y))) continue;
      const edge = Math.max(Math.abs(x), Math.abs(y)) > town;
      const roll = hash(x, y, 1);
      if (roll < (edge ? 0.5 : 0.1)) work.place('tree', { x, y, w: 1, h: 1 }, true, hash(x, y, 2));
      else if (roll > 0.95) work.place('drift', { x, y, w: 1, h: 1 }, false, hash(x, y, 3));
    }
}
