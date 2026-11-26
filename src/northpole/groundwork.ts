/**
 * The groundwork the North Pole is laid out with: the ground under each tile,
 * the tiles nobody can walk on, the things standing about, and the tiles kept
 * clear for paths and spots so the forest never grows over them. The town, the
 * sights and the forest (`world-town.ts`, `world-sights.ts`) all lay their part
 * through it, in the same order every time, so the same squares always make the
 * same world.
 */
import { hash, key, type Box, type Ground, type Thing, type ThingKind } from './world';

export interface Groundwork {
  /** The ground of every tile that isn't plain snow. */
  ground: Map<string, Ground>;
  /** Every tile you can't walk on. */
  blocked: Set<string>;
  things: Thing[];
  /** Tiles nothing may grow on: paths, spots and the room round them. */
  kept: Set<string>;
  /** Keeps a box of tiles, and `margin` tiles round it, clear of trees and drifts. */
  keep: (box: Box, margin?: number) => void;
  /** Lays ground over a box of tiles, and keeps it clear. */
  lay: (box: Box, kind: Ground) => void;
  /** Stands a thing on a box of tiles, blocking them unless `blocks` is false. */
  place: (kind: ThingKind, box: Box, blocks?: boolean, seed?: number) => void;
}

/** Every tile of a box, as the world's keys. */
const tileKeys = (box: Box): string[] => {
  const keys: string[] = [];
  for (let x = box.x; x < box.x + box.w; x++)
    for (let y = box.y; y < box.y + box.h; y++) keys.push(key(x, y));
  return keys;
};

/** Fresh groundwork: all snow, nothing standing, nothing kept. */
export function startGroundwork(): Groundwork {
  const ground = new Map<string, Ground>();
  const blocked = new Set<string>();
  const things: Thing[] = [];
  const kept = new Set<string>();

  const keep = (box: Box, margin = 0) => {
    const grown = {
      x: box.x - margin,
      y: box.y - margin,
      w: box.w + 2 * margin,
      h: box.h + 2 * margin,
    };
    for (const at of tileKeys(grown)) kept.add(at);
  };
  const lay = (box: Box, kind: Ground) => {
    for (const at of tileKeys(box)) {
      // A bridge or water stays put where a path crosses it.
      const now = ground.get(at);
      if (kind === 'path' && (now === 'bridge' || now === 'water')) continue;
      ground.set(at, kind);
      if (kind === 'water' || kind === 'ice') blocked.add(at);
      else blocked.delete(at);
    }
    keep(box);
  };
  const place = (kind: ThingKind, box: Box, blocks = true, seed = hash(box.x, box.y, 7)) => {
    things.push({ kind, ...box, seed, blocks });
    if (blocks) for (const at of tileKeys(box)) blocked.add(at);
    keep(box);
  };
  return { ground, blocked, things, kept, keep, lay, place };
}

/** Blocks every tile of a box, with nothing drawn there. */
export function blockBox(work: Groundwork, box: Box): void {
  for (const at of tileKeys(box)) work.blocked.add(at);
}
