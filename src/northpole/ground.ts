/**
 * The ground under everything: snow, the cleared paths, the town square, the
 * ice and the stream, with the stream's ripples and the warm pools of light on
 * the snow drawn live over it. The island draws the ground once to its layer.
 */
import { middle } from './brushes';
import { faceOf, onFace } from './faces';
import { theme } from './theme';
import { hash, key, TILE_H, TILE_W, toScreen, type Ground, type World } from './world';

const { colors } = theme;

/** The tiles in view, as a range to loop over. */
interface TileRange {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const GROUND: Record<Ground, string> = {
  snow: colors.snow,
  path: colors.snowShade,
  plaza: colors.snowShade,
  ice: colors.ice,
  water: colors.ice,
  bridge: colors.gingerbread,
  floor: colors.gingerbread,
  carpet: colors.dusk,
};

/** The ground: snow, the cleared paths, the town square, the ice and the stream. The stream's ripples run in `drawRipples`. */
export function drawGround(ctx: CanvasRenderingContext2D, world: World, range: TileRange) {
  const half = { w: TILE_W / 2, h: TILE_H / 2 };
  for (let x = range.minX; x <= range.maxX; x++)
    for (let y = range.minY; y <= range.maxY; y++) {
      const ground = world.ground.get(key(x, y)) ?? 'snow';
      const { x: sx, y: sy } = toScreen({ x, y });
      ctx.fillStyle = GROUND[ground];
      ctx.beginPath();
      ctx.moveTo(sx, sy - half.h - 0.5);
      ctx.lineTo(sx + half.w + 0.5, sy);
      ctx.lineTo(sx, sy + half.h + 0.5);
      ctx.lineTo(sx - half.w - 0.5, sy);
      ctx.fill();
      if (ground === 'snow' && hash(x, y, 9) < 0.3) {
        ctx.fillStyle = colors.snowShade;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(sx + (hash(x, y, 10) - 0.5) * 20, sy, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (ground === 'plaza' && (x + y) % 2 === 0) {
        ctx.strokeStyle = colors.muted;
        ctx.globalAlpha = 0.3;
        ctx.strokeRect(sx - 6, sy - 3, 12, 6);
        ctx.globalAlpha = 1;
      } else if (ground === 'water') {
        // The stream runs on, its ripples catching the light.
        ctx.fillStyle = colors.surface;
        ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (ground === 'ice') {
        ctx.strokeStyle = colors.snow;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(sx - 12, sy - 2);
        ctx.lineTo(sx + 8 * hash(x, y, 11), sy + 3);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (ground === 'floor' || ground === 'carpet') indoorTile(ctx, ground, sx, sy, x, y);
      else if (ground === 'bridge') {
        ctx.strokeStyle = colors.wood;
        for (let n = -2; n <= 2; n++) {
          ctx.beginPath();
          ctx.moveTo(sx + n * 7 - 8, sy - n * 3.5 - 4);
          ctx.lineTo(sx + n * 7 + 8, sy - n * 3.5 + 4);
          ctx.stroke();
        }
      }
    }
}

/** A room's tile: boards with a seam, or carpet with a faint weave. */
function indoorTile(
  ctx: CanvasRenderingContext2D,
  ground: 'floor' | 'carpet',
  sx: number,
  sy: number,
  x: number,
  y: number,
) {
  ctx.globalAlpha = 0.45;
  if (ground === 'floor') {
    // Boards run along x, a seam each side of the middle, and a knot here and there.
    ctx.strokeStyle = colors.wood;
    for (const n of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sx - 16 - 8 * n, sy - 8 + 4 * n);
      ctx.lineTo(sx + 16 - 8 * n, sy + 8 + 4 * n);
      ctx.stroke();
    }
    if (hash(x, y, 12) < 0.3) {
      ctx.fillStyle = colors.cocoa;
      ctx.fillRect(sx + (hash(x, y, 13) - 0.5) * 16, sy - 1, 3, 2);
    }
  } else {
    ctx.strokeStyle = colors.violet;
    ctx.globalAlpha = 0.25;
    ctx.strokeRect(sx - 4, sy - 2, 8, 4);
  }
  ctx.globalAlpha = 1;
}

/** Warm pools of light on the snow round the lamps, the stalls and the attractions. */
export function drawLightPools(ctx: CanvasRenderingContext2D, world: World, time: number) {
  const pool = (x: number, y: number, rx: number, strength: number) => {
    ctx.fillStyle = colors.lantern;
    for (const r of [1, 0.66, 0.36]) {
      ctx.globalAlpha = 0.09 * strength;
      ctx.beginPath();
      ctx.ellipse(x, y, rx * r, rx * r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  for (const thing of world.things) {
    if (thing.kind === 'lamp' || thing.kind === 'cart' || thing.kind === 'spotlight') {
      const { x, y } = toScreen(thing);
      pool(x, y, 58, 0.85 + 0.15 * Math.sin(time / 900 + thing.seed * 20));
    } else if (thing.kind === 'cabin' || thing.kind === 'tent') {
      const { x, y } = middle(thing);
      pool(x, y + 26, 70, 0.8);
    }
  }
  for (const spot of world.spots) {
    if (spot.kind === 'open') continue;
    const face = faceOf(spot);
    const at = onFace(face, 0.5, 0, 0.6);
    pool(at.x, at.y, spot.kind === 'attraction' ? 110 : 76, 1);
  }
  ctx.globalAlpha = 1;
}

/** The stream's ripples, drawn live over the island's layer. */
export function drawRipples(ctx: CanvasRenderingContext2D, world: World, time: number) {
  ctx.strokeStyle = colors.snow;
  ctx.globalAlpha = 0.7;
  for (const [at, ground] of world.ground) {
    if (ground !== 'water') continue;
    // The tile's key is "x,y".
    const comma = at.indexOf(',');
    const [x, y] = [Number(at.slice(0, comma)), Number(at.slice(comma + 1))];
    const { x: sx, y: sy } = toScreen({ x, y });
    const ripple = ((time / 40 + y * 13) % 24) - 12;
    ctx.beginPath();
    ctx.moveTo(sx - 10 + ripple / 2, sy + ripple / 4);
    ctx.lineTo(sx + ripple / 2, sy + ripple / 4 + 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
