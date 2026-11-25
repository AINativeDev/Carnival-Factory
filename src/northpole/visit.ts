/**
 * Visiting a square inside the world, and the tag that names what you hover:
 * the open plot nearest a square, the line Share copies and where it links,
 * what's under the mouse and where its tag goes. Plain functions, so the map
 * and the tests use them the same way. Points are in world pixels unless they
 * say otherwise.
 */
import { SITE_NAME } from '../edition';
import { squareOwner } from './north-pole-levels';
import { findPathToFirst } from './pathfinding';
import { tileOf } from './walking';
import { type Box, type Plot, type Tile, type World } from './world';

/**
 * The open plots, nearest `from` first, and the path to the nearest one the
 * player can reach: the first step is `from`'s own tile. Undefined when no
 * open plot can be reached.
 */
export function nearestOpenPlot(
  world: World,
  from: Tile,
): { plot: Plot; path: Tile[] } | undefined {
  const open = world.plots
    .filter((plot) => plot.kind === 'open')
    .sort(
      (a, b) =>
        Math.hypot(a.door.x - from.x, a.door.y - from.y) -
        Math.hypot(b.door.x - from.x, b.door.y - from.y),
    );
  const start = tileOf(from);
  const way = findPathToFirst(
    world,
    start,
    open.map((plot) => plot.door),
  );
  const end = way?.at(-1) ?? start;
  // A walk ends at the door it was found for, so whenever there's a walk its plot is found.
  const plot = open.find((p) => p.door.x === end.x && p.door.y === end.y);
  return way && plot && { plot, path: [start, ...way] };
}

/**
 * The `count` squares whose doors are nearest the player, nearest first, in
 * tiles. Squares at the same distance keep the order they came in.
 */
export function nearYou<T extends { door: { x: number; y: number } }>(
  squares: readonly T[],
  player: { x: number; y: number },
  count = 5,
): T[] {
  const far = (square: T) => Math.hypot(square.door.x - player.x, square.door.y - player.y);
  return squares
    .map((square, n) => ({ square, n, far: far(square) }))
    .sort((a, b) => a.far - b.far || a.n - b.n)
    .slice(0, count)
    .map(({ square }) => square);
}

/** What Share copies for a square or a level: a short, friendly line crediting its owner, and the link. */
export function shareText(
  square: { kind: 'booth' | 'attraction' | 'level'; id: string; name: string },
  link: string,
  mine = false,
): string {
  const what = square.kind === 'level' ? `${square.name}, a level,` : square.name;
  const owner = squareOwner(square.kind, square.id);
  if (!owner) return `${what} is at ${SITE_NAME}. Come visit, and get a booth too: ${link}`;
  const who = mine ? 'I' : `@${owner}`;
  return `${who} built ${what} at ${SITE_NAME}. Come visit, and get a booth too: ${link}`;
}

/** Where a square's link-preview page is, from the site's root. */
export const sharePath = (kind: 'booth' | 'attraction', id: string) => `share/${kind}-${id}.html`;

/**
 * The address of a square's link-preview page, from the page's own address.
 * A pull request's preview, under `previews/pr-<number>/`, is taken down when
 * the pull request closes, so its links go to the live site's page instead,
 * which lasts.
 */
export function shareLink(kind: 'booth' | 'attraction', id: string, base: string): string {
  const site = new URL('./', base);
  site.pathname = site.pathname.replace(/\/previews\/pr-\d+\/$/, '/');
  return new URL(sharePath(kind, id), site).href;
}

/** Whether a point is in a box, edges included. */
export const inBox = (point: Tile, box: Box) =>
  point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h;

/**
 * The plot under a point, from what the map drew this frame, back to front: the
 * frontmost structure whose drawn outline, its height included, holds it.
 */
export function targetAt<T extends { box: Box }>(
  targets: readonly T[],
  point: Tile,
): T | undefined {
  for (let n = targets.length - 1; n >= 0; n--) if (inBox(point, targets[n].box)) return targets[n];
  return undefined;
}

/**
 * What a hover tag says: its name, who it belongs to (nobody, for an
 * attraction), a line of its description and a hint. A construction site says
 * who it's being built for and `stage`, how far along it is, and nothing from
 * the request itself.
 */
export function tagText(
  plot: Pick<Plot, 'kind' | 'id'>,
  square: { name: string; description: string } | undefined,
  stage = '',
): { name: string; owner: string; line: string; hint: string } {
  if (plot.kind === 'site')
    return {
      name: 'Being built',
      owner: '',
      line: `Booth for @${plot.id ?? ''}: ${stage}`,
      hint: 'E or click to see the request',
    };
  if (plot.kind === 'open')
    return {
      name: 'Free spot',
      owner: '',
      line: 'Ask for a booth, and an agent builds it here.',
      hint: 'E or click to build your booth here',
    };
  return {
    name: square?.name ?? plot.id ?? '',
    owner: plot.kind === 'attraction' ? '' : `@${plot.id}`,
    line: (square?.description ?? '').split(/\r?\n|(?<=[.!?])\s/)[0],
    hint: 'E or click to visit',
  };
}

/**
 * The hover tag of a sleigh platform: at the station, the level it goes to and
 * its owner; inside a level, the way back to the North Pole.
 */
export function platformTag(
  kind: 'platform' | 'exit',
  label: { name: string; by: string; closed: boolean },
): { name: string; owner: string; line: string; hint: string } {
  if (kind === 'exit')
    return {
      name: 'The sleigh home',
      owner: '',
      line: 'Back to the North Pole.',
      hint: 'E or click to ride it',
    };
  return {
    name: label.name,
    owner: label.by,
    line: label.closed ? 'Closed for repairs.' : 'A level of its own, a sleigh ride away.',
    hint: label.closed ? '' : 'E or click to ride the sleigh there',
  };
}

/**
 * Where a hover tag of `size` goes, in screen pixels: centred above `anchor`,
 * kept inside the viewport, and moved aside if it would cover `player`, the
 * box round the player on screen.
 */
export function placeTag(
  anchor: Tile,
  size: { w: number; h: number },
  player: Box,
  viewport: { w: number; h: number },
  gap = 8,
): Tile {
  const clamp = (at: Tile) => ({
    x: Math.max(gap, Math.min(viewport.w - size.w - gap, at.x)),
    y: Math.max(gap, Math.min(viewport.h - size.h - gap, at.y)),
  });
  const covers = (at: Tile) =>
    at.x < player.x + player.w &&
    at.x + size.w > player.x &&
    at.y < player.y + player.h &&
    at.y + size.h > player.y;
  const above = clamp({ x: anchor.x - size.w / 2, y: anchor.y - size.h - gap });
  if (!covers(above)) return above;
  const tries = [
    { x: player.x + player.w + gap, y: above.y },
    { x: player.x - size.w - gap, y: above.y },
    { x: above.x, y: player.y - size.h - gap },
    { x: above.x, y: player.y + player.h + gap },
  ].map(clamp);
  return tries.find((at) => !covers(at)) ?? above;
}
