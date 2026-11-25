/**
 * What a lift hill, a drop and a station add to a tile of coaster track
 * (`coaster.ts` draws the track itself): the lift hill's chain that pulls the
 * car up, the drop's braced legs, and the station's platform and canopy where
 * a ride level's car stops for its square (ADR 0041). Nothing here moves, so
 * nothing flashes.
 */
import { block, corners, diamond, glow } from './brushes';
import { drawCoaster, post } from './coaster';
import { railOf } from './coaster-ride';
import { theme } from './theme';
import { toScreen, type Thing, type Tile } from './world';

const { colors } = theme;

/** How many links of chain a lift hill's tile shows. */
const LINKS = 6;

/** A point `f` of the way along the rail through a piece, from where it comes on to where it leaves. */
function alongRail(piece: Thing, f: number): Tile {
  const { enter, middle, leave } = railOf(piece);
  const [a, b, g] = f < 0.5 ? [enter, middle, f * 2] : [middle, leave, f * 2 - 1];
  return { x: a.x + (b.x - a.x) * g, y: a.y + (b.y - a.y) * g };
}

/** The lift hill's chain: dark links along the middle of the rail, which pull the car up. */
function chain(ctx: CanvasRenderingContext2D, piece: Thing, front: boolean) {
  if (!front) return;
  ctx.fillStyle = colors.night;
  for (let n = 0; n < LINKS; n++) {
    const { x, y } = alongRail(piece, (n + 0.5) / LINKS);
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
}

/** A drop's braced legs: two more posts, splayed either side of its own, so the steep track stands firm. */
function braces(ctx: CanvasRenderingContext2D, piece: Thing, front: boolean) {
  if (front) return;
  const foot = toScreen(piece);
  const top = railOf(piece).middle;
  for (const side of [-1, 1]) post(ctx, { x: foot.x + side * 14, y: foot.y + 3 }, top);
}

/** A station's platform under the rail, on its posts, and its canopy over the car, lit by a lamp. */
function platform(ctx: CanvasRenderingContext2D, piece: Thing, front: boolean) {
  const deck = railOf(piece).middle;
  const lift = toScreen(piece).y - deck.y - 4;
  if (!front) {
    const c = corners(piece);
    for (const corner of [c.left, c.bottom, c.right])
      post(ctx, corner, { x: corner.x, y: corner.y - lift });
    block(ctx, piece, 5, colors.wood, colors.cocoa, colors.gingerbread, lift - 5);
    return;
  }
  // The canopy: two posts at the back corners, and a striped roof over the car.
  const c = corners(piece);
  const roof = lift + 54;
  for (const corner of [c.left, c.right])
    post(ctx, { x: corner.x, y: corner.y - lift }, { x: corner.x, y: corner.y - roof });
  ctx.fillStyle = colors.berry;
  diamond(ctx, c, roof);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(c.left.x, c.left.y - roof - 2, c.right.x - c.left.x, 3);
  glow(ctx, deck.x, deck.y - 30, 22, 0.45);
}

/** A tile of lift hill: track with a chain up its middle. */
export function drawCoasterLift(ctx: CanvasRenderingContext2D, piece: Thing, time: number) {
  drawCoaster(ctx, piece, time, chain);
}

/** A tile of drop: track on braced legs. */
export function drawCoasterDrop(ctx: CanvasRenderingContext2D, piece: Thing, time: number) {
  drawCoaster(ctx, piece, time, braces);
}

/** A station: track over a platform, under a canopy. */
export function drawCoasterStation(ctx: CanvasRenderingContext2D, piece: Thing, time: number) {
  drawCoaster(ctx, piece, time, platform);
}
