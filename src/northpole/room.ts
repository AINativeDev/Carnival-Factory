/**
 * An indoor level's room (ADR 0040), drawn once to its own layer in place of
 * the island: the floor's cut edge where the island's snow slab would be, the
 * floor itself, and the two back walls, cut away like a doll's house so the
 * visitor looks in over the front edges. The walls are panelled below and
 * papered above, with a skirting board, a cornice and warm wall lamps, in the
 * dusk palette. What hangs on them (`wall-things.ts`) finds its wall with
 * `wallFace`.
 */
import { corners, glow, quad } from './brushes';
import { alongEdge } from './camera';
import type { Face } from './faces';
import { drawGround } from './ground';
import type { Island } from './island';
import { theme } from './theme';
import { TILE_H, TILE_W, type Thing, type Tile, type World } from './world';

const { colors } = theme;

/** How tall the back walls stand, the panelling and the skirting board on them, and how thick the floor is, in world pixels. */
export const WALL = { high: 124, panel: 34, skirting: 7, floor: 16 };

/**
 * The wall a wall-mounted thing hangs on, as a face we see: along the upper
 * right wall from its top corner, or along the upper left one towards it,
 * with a tile's step out into the room.
 */
export function wallFace(thing: Thing): Face {
  const c = corners(thing);
  return thing.wall === 'left'
    ? { a: c.left, b: c.top, out: { x: TILE_W / 2, y: TILE_H / 2 } }
    : { a: c.top, b: c.right, out: { x: -TILE_W / 2, y: TILE_H / 2 } };
}

/** A strip up a wall from `a` to `b`, from `low` to `high` above the floor. */
function strip(ctx: CanvasRenderingContext2D, a: Tile, b: Tile, low: number, high: number) {
  quad(ctx, [
    { x: a.x, y: a.y - low },
    { x: b.x, y: b.y - low },
    { x: b.x, y: b.y - high },
    { x: a.x, y: a.y - high },
  ]);
}

/** One back wall from `a` to `b`: papered, panelled below, with its skirting board, cornice and lamps. */
function backWall(ctx: CanvasRenderingContext2D, a: Tile, b: Tile, paper: string) {
  ctx.fillStyle = paper;
  strip(ctx, a, b, 0, WALL.high);
  ctx.fill();
  // Pale stripes in the paper, upright, so the wall reads as a wall and not as sky.
  ctx.strokeStyle = colors.duskLow;
  ctx.globalAlpha = 0.35;
  for (const p of alongEdge(a, b, 18)) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - WALL.panel - 2);
    ctx.lineTo(p.x, p.y - WALL.high + 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cocoa;
  strip(ctx, a, b, 0, WALL.panel);
  ctx.fill();
  ctx.fillStyle = colors.wood;
  strip(ctx, a, b, WALL.panel - 3, WALL.panel);
  ctx.fill();
  strip(ctx, a, b, 0, WALL.skirting);
  ctx.fill();
  ctx.fillStyle = colors.cream;
  strip(ctx, a, b, WALL.high - 6, WALL.high);
  ctx.fill();
  // Warm lamps along the wall, every few tiles.
  for (const p of alongEdge(a, b, TILE_W * 2.5)) {
    glow(ctx, p.x, p.y - 92, 30, 0.9);
    ctx.fillStyle = colors.gold;
    ctx.fillRect(p.x - 4, p.y - 96, 8, 7);
    ctx.fillStyle = colors.glow;
    ctx.fillRect(p.x - 3, p.y - 95, 6, 4);
  }
}

/** The floor's cut edge along one of the room's front edges, `thick` deep. */
function floorEdge(ctx: CanvasRenderingContext2D, a: Tile, b: Tile, color: string, thick: number) {
  ctx.fillStyle = color;
  quad(ctx, [a, b, { x: b.x, y: b.y + thick }, { x: a.x, y: a.y + thick }]);
  ctx.fill();
  ctx.strokeStyle = colors.cocoa;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y + thick / 2);
  ctx.lineTo(b.x, b.y + thick / 2);
  ctx.stroke();
}

/** The room, drawn once to its own layer: its shadow, the floor's cut edges, the floor and the two back walls. */
export function drawRoom(ctx: CanvasRenderingContext2D, world: World, island: Island) {
  const { top, right, bottom, left } = island;
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(
    bottom.x,
    bottom.y + WALL.floor + 16,
    (right.x - left.x) * 0.42,
    30,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.globalAlpha = 1;
  floorEdge(ctx, left, bottom, colors.wood, WALL.floor);
  floorEdge(ctx, bottom, right, colors.cocoa, WALL.floor);
  drawGround(ctx, world, {
    minX: -world.extent,
    maxX: world.extent,
    minY: -world.extent,
    maxY: world.extent,
  });
  // Lit from the upper left: the wall facing it is the lighter one.
  backWall(ctx, left, top, colors.mountainFar);
  backWall(ctx, top, right, colors.mountain);
  // The walls' cut ends at the front, and the corner where they meet.
  ctx.fillStyle = colors.cream;
  for (const end of [left, right]) ctx.fillRect(end.x - 3, end.y - WALL.high, 6, WALL.high);
  ctx.strokeStyle = colors.shadow;
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(top.x, top.y - WALL.high);
  ctx.stroke();
}
