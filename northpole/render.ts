/**
 * Drawing the isometric North Pole: the ground, the things standing on it, the
 * stalls and attractions with their squares' drawings on their front panels,
 * and the people walking about. Everything is drawn in world pixels, with the
 * town square's centre at (0, 0), and the map moves the camera.
 */
import type { NorthPoleSquare, StallShape, StallStyle } from './square';
import { badgeFor, type BadgeTier } from './badges';
import { trophyFor } from './peoples-choice';
import { PEOPLES_CHOICE } from './peoples-choice-standings';
import { alongEdge } from './camera';
import { canvasFont, theme } from './theme';
import {
  hash,
  key,
  TILE_H,
  TILE_W,
  toScreen,
  type Box,
  type Ground,
  type Plot,
  type Thing,
  type Tile,
  type World,
} from './world';

const { colors } = theme;

/** Where a box's ground diamond has its corners on screen. */
function corners(box: Box) {
  const at = (x: number, y: number) => toScreen({ x: x - 0.5, y: y - 0.5 });
  return {
    top: at(box.x, box.y),
    right: at(box.x + box.w, box.y),
    bottom: at(box.x + box.w, box.y + box.h),
    left: at(box.x, box.y + box.h),
  };
}

/** The middle of a box's footprint on screen. */
export function middle(box: Box): Tile {
  return toScreen({ x: box.x + (box.w - 1) / 2, y: box.y + (box.h - 1) / 2 });
}

function diamond(ctx: CanvasRenderingContext2D, c: ReturnType<typeof corners>, lift = 0) {
  ctx.beginPath();
  ctx.moveTo(c.top.x, c.top.y - lift);
  ctx.lineTo(c.right.x, c.right.y - lift);
  ctx.lineTo(c.bottom.x, c.bottom.y - lift);
  ctx.lineTo(c.left.x, c.left.y - lift);
  ctx.closePath();
}

/** A box standing `height` high on its footprint: its two front faces and its top. */
function block(
  ctx: CanvasRenderingContext2D,
  box: Box,
  height: number,
  top: string,
  left: string,
  right: string,
  lift = 0,
) {
  const c = corners(box);
  ctx.fillStyle = left;
  ctx.beginPath();
  ctx.moveTo(c.left.x, c.left.y - lift);
  ctx.lineTo(c.bottom.x, c.bottom.y - lift);
  ctx.lineTo(c.bottom.x, c.bottom.y - lift - height);
  ctx.lineTo(c.left.x, c.left.y - lift - height);
  ctx.fill();
  ctx.fillStyle = right;
  ctx.beginPath();
  ctx.moveTo(c.bottom.x, c.bottom.y - lift);
  ctx.lineTo(c.right.x, c.right.y - lift);
  ctx.lineTo(c.right.x, c.right.y - lift - height);
  ctx.lineTo(c.bottom.x, c.bottom.y - lift - height);
  ctx.fill();
  ctx.fillStyle = top;
  diamond(ctx, c, lift + height);
  ctx.fill();
}

/** A soft round glow, as a lamp or a window throws. */
function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  strength: number,
) {
  ctx.fillStyle = colors.glow;
  for (const r of [radius, radius * 0.65, radius * 0.35]) {
    ctx.globalAlpha = 0.12 * strength;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** The tiles in view, as a range to loop over. */
export interface TileRange {
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
      } else if (ground === 'bridge') {
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

/** Snowdrifts lie on the ground, under everything standing. */
export function drawDrift(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  const width = 14 + 8 * thing.seed;
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, width, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.ellipse(x - 2, y, width * 0.8, 5, 0, Math.PI, 0);
  ctx.ellipse(x + width * 0.3, y, width * 0.45, 8, 0, Math.PI, 0);
  ctx.fill();
}

/** A shadow on the snow under something standing. */
function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(x, y, width, width / 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** A pine tree with snow on its branches, `scale` times the usual size. */
export function drawPine(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(-3, -10, 6, 12);
  for (const [top, half, height] of [
    [-62, 11, 22],
    [-48, 16, 24],
    [-32, 21, 24],
  ]) {
    ctx.fillStyle = colors.pineDark;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(half, top + height);
    ctx.lineTo(-half, top + height);
    ctx.fill();
    ctx.fillStyle = colors.pine;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(-half, top + height);
    ctx.lineTo(-half / 3, top + height);
    ctx.fill();
    // Snow along the branches.
    ctx.fillStyle = colors.snow;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(half * 0.5, top + height * 0.5);
    ctx.lineTo(half * 0.15, top + height * 0.42);
    ctx.lineTo(-half * 0.2, top + height * 0.55);
    ctx.lineTo(-half * 0.5, top + height * 0.5);
    ctx.fill();
    ctx.fillRect(-half, top + height - 2, half * 2, 2);
  }
  ctx.restore();
}

/** Pine trees drawn once each size, at the resolution the map asked for, to copy rather than redraw. */
const pines = new Map<number, HTMLCanvasElement>();
let pineResolution = 0;
const PINE_SIZES = 4;

/** Sets how many device pixels a world pixel covers at the nearest the camera comes, for the trees drawn ahead. */
export function setSpriteResolution(resolution: number) {
  const rounded = Math.max(0.25, Math.round(resolution * 8) / 8);
  if (rounded === pineResolution) return;
  pineResolution = rounded;
  pines.clear();
}

function pineSprite(size: number): HTMLCanvasElement | undefined {
  if (!pineResolution || typeof document === 'undefined') return undefined;
  let sprite = pines.get(size);
  if (!sprite) {
    const scale = 0.8 + (0.45 * size) / (PINE_SIZES - 1);
    sprite = document.createElement('canvas');
    sprite.width = Math.ceil(50 * scale * pineResolution);
    sprite.height = Math.ceil(70 * scale * pineResolution);
    const ctx = sprite.getContext('2d')!;
    ctx.scale(pineResolution, pineResolution);
    drawPine(ctx, 25 * scale, 66 * scale, scale);
    pines.set(size, sprite);
  }
  return sprite;
}

function drawTree(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 16);
  const size = Math.round(thing.seed * (PINE_SIZES - 1));
  const sprite = pineSprite(size);
  const at = x + (thing.seed - 0.5) * 10;
  if (!sprite) return drawPine(ctx, at, y + 2, 0.8 + (0.45 * size) / (PINE_SIZES - 1));
  const w = sprite.width / pineResolution;
  const h = sprite.height / pineResolution;
  const scale = 0.8 + (0.45 * size) / (PINE_SIZES - 1);
  ctx.drawImage(sprite, at - 25 * scale, y + 2 - 66 * scale, w, h);
}

/** The town square's tree, decorated, its baubles twinkling and a star on top. */
function drawTownTree(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 4, 40);
  drawPine(ctx, x, y + 6, 2.4);
  const baubles = [
    [-14, -60],
    [12, -66],
    [-24, -84],
    [20, -92],
    [-6, -104],
    [8, -122],
    [-16, -128],
    [30, -72],
    [-34, -70],
    [2, -84],
  ];
  baubles.forEach(([bx, by], n) => {
    ctx.globalAlpha = Math.sin(time / 500 + n * 1.9) > -0.3 ? 1 : 0.4;
    ctx.fillStyle = [colors.berry, colors.gold, colors.violet][n % 3];
    ctx.beginPath();
    ctx.arc(x + bx, y + by, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  glow(ctx, x, y - 152, 22, 0.8 + 0.2 * Math.sin(time / 400));
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  for (let n = 0; n < 10; n++) {
    const r = n % 2 ? 4 : 10;
    const a = (n / 10) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * r, y - 152 + Math.sin(a) * r);
  }
  ctx.fill();
}

/** A lamp post, its light glowing in the dark. */
function drawLamp(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  const breath = 0.8 + 0.2 * Math.sin(time / 900 + thing.seed * 20);
  glow(ctx, x, y - 44, 34, breath);
  ctx.fillStyle = colors.night;
  ctx.fillRect(x - 2, y - 42, 4, 44);
  ctx.fillRect(x - 5, y - 2, 10, 4);
  ctx.fillRect(x - 6, y - 50, 12, 3);
  ctx.fillStyle = colors.glow;
  ctx.fillRect(x - 4, y - 47, 8, 7);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 6, y - 52, 12, 2);
}

/** A stretch of picket fence across the tile, snow on its rails. */
function drawFence(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  const w = TILE_W / 2 - 4;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - w, y - 14, 2 * w, 3);
  ctx.fillRect(x - w, y - 6, 2 * w, 3);
  for (let px = -w; px <= w; px += w / 2) ctx.fillRect(x + px - 2, y - 20, 4, 20);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - w, y - 16, 2 * w, 2);
  for (let px = -w; px <= w; px += w / 2) ctx.fillRect(x + px - 2, y - 22, 4, 3);
}

/** A pitched roof over a box, with snow along its ridge and down its slopes. */
function roof(ctx: CanvasRenderingContext2D, box: Box, wall: number, rise: number, color: string) {
  const c = corners(box);
  // The ridge runs along the box's longer side.
  const along = box.w >= box.h;
  const mid = (a: Tile, b: Tile) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - wall - rise });
  const [ridgeA, ridgeB] = along
    ? [mid(c.top, c.left), mid(c.right, c.bottom)]
    : [mid(c.top, c.right), mid(c.left, c.bottom)];
  const up = (p: Tile) => ({ x: p.x, y: p.y - wall });
  const slopes = along
    ? [
        [up(c.left), up(c.bottom), ridgeB, ridgeA],
        [up(c.top), up(c.right), ridgeB, ridgeA],
      ]
    : [
        [up(c.right), up(c.bottom), ridgeB, ridgeA],
        [up(c.top), up(c.left), ridgeB, ridgeA],
      ];
  // The far slope first, then the near one over it.
  for (const [n, face] of [slopes[1], slopes[0]].entries()) {
    ctx.fillStyle = n ? colors.snow : colors.snowShade;
    ctx.beginPath();
    face.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.fill();
  }
  // The roof's edge shows under the snow.
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const near = slopes[0];
  ctx.moveTo(near[0].x, near[0].y);
  ctx.lineTo(near[1].x, near[1].y);
  ctx.stroke();
  ctx.lineWidth = 1;
  // The gable end facing us.
  const gable = along ? [up(c.right), up(c.bottom), ridgeB] : [up(c.left), up(c.bottom), ridgeB];
  ctx.fillStyle = color;
  ctx.beginPath();
  gable.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.fill();
}

/** A window in a front face, lit from inside. */
function window_(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, seed: number) {
  const flicker = 0.85 + 0.15 * Math.sin(time / 300 + seed * 40);
  glow(ctx, x, y, 18, flicker);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 7, y - 7, 14, 14);
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = flicker;
  ctx.fillRect(x - 5, y - 5, 10, 10);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 0.75, y - 5, 1.5, 10);
  ctx.fillRect(x - 5, y - 0.75, 10, 1.5);
}

/** Smoke drifting up from a chimney. */
function smoke(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, seed: number) {
  ctx.fillStyle = colors.snowShade;
  for (let n = 0; n < 5; n++) {
    const age = (time / 1600 + n / 5 + seed) % 1;
    ctx.globalAlpha = 0.5 * (1 - age);
    ctx.beginPath();
    ctx.arc(x + Math.sin(age * 5 + seed * 9) * 6 + age * 14, y - age * 50, 4 + age * 8, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A log cabin: log walls, lit windows, a snowy roof and a smoking chimney. */
function drawCabin(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const wall = 36;
  const c = corners(thing);
  shadow(ctx, middle(thing).x, middle(thing).y + 6, 50);
  block(ctx, thing, wall, colors.wood, colors.wood, colors.cocoa);
  // The logs.
  ctx.strokeStyle = colors.cocoa;
  ctx.globalAlpha = 0.6;
  for (let h = 6; h < wall; h += 6) {
    ctx.beginPath();
    ctx.moveTo(c.left.x, c.left.y - h);
    ctx.lineTo(c.bottom.x, c.bottom.y - h);
    ctx.lineTo(c.right.x, c.right.y - h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // A door on the left face, windows either side of it.
  const along = (a: Tile, b: Tile, t: number, h: number) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t - h,
  });
  const door = along(c.left, c.bottom, 0.5, 0);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(door.x - 6, door.y - 22, 12, 20);
  for (const t of [0.22, 0.78]) {
    const at = along(c.left, c.bottom, t, 18);
    window_(ctx, at.x, at.y, time, thing.seed + t);
  }
  const side = along(c.bottom, c.right, 0.5, 18);
  window_(ctx, side.x, side.y, time, thing.seed + 2);
  // The chimney goes up through the far slope, and smoke from it.
  const chimney = along(c.top, c.right, 0.4, wall + 30);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(chimney.x - 5, chimney.y - 6, 10, 26);
  roof(ctx, thing, wall, 30, colors.cocoa);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(chimney.x - 5, chimney.y - 6, 10, 10);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(chimney.x - 6, chimney.y - 8, 12, 3);
  smoke(ctx, chimney.x, chimney.y - 10, time, thing.seed);
}

/** The reindeer's stable: a red barn with its doors open. */
function drawStable(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const wall = 40;
  const c = corners(thing);
  shadow(ctx, middle(thing).x, middle(thing).y + 6, 60);
  block(ctx, thing, wall, colors.berry, colors.berry, colors.cocoa);
  const mid = { x: (c.left.x + c.bottom.x) / 2, y: (c.left.y + c.bottom.y) / 2 };
  ctx.fillStyle = colors.night;
  ctx.fillRect(mid.x - 12, mid.y - 30, 24, 28);
  ctx.strokeStyle = colors.snow;
  ctx.lineWidth = 2;
  ctx.strokeRect(mid.x - 12, mid.y - 30, 24, 28);
  ctx.beginPath();
  ctx.moveTo(mid.x - 12, mid.y - 30);
  ctx.lineTo(mid.x + 12, mid.y - 2);
  ctx.moveTo(mid.x + 12, mid.y - 30);
  ctx.lineTo(mid.x - 12, mid.y - 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  const side = { x: (c.bottom.x + c.right.x) / 2, y: (c.bottom.y + c.right.y) / 2 - 22 };
  window_(ctx, side.x, side.y, time, thing.seed);
  roof(ctx, thing, wall, 28, colors.cocoa);
  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.fillText('Reindeer', mid.x, mid.y - 34);
}

/** Santa's sleigh, parked, with a sack of presents. */
function drawSleigh(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = middle(thing);
  shadow(ctx, x, y + 4, 40);
  ctx.save();
  ctx.translate(x, y);
  // Runners.
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(26, 0);
  ctx.quadraticCurveTo(40, 0, 38, -12);
  ctx.stroke();
  ctx.lineWidth = 1;
  // The body, curling up at the front.
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(-32, -6);
  ctx.lineTo(22, -6);
  ctx.quadraticCurveTo(36, -10, 34, -30);
  ctx.quadraticCurveTo(24, -26, 20, -18);
  ctx.lineTo(-10, -18);
  ctx.lineTo(-14, -34);
  ctx.lineTo(-32, -34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-32, -12, 54, 3);
  // The sack of presents.
  ctx.fillStyle = colors.gingerbread;
  ctx.beginPath();
  ctx.ellipse(2, -26, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.pine;
  ctx.fillRect(-8, -44, 10, 10);
  ctx.fillStyle = colors.violet;
  ctx.fillRect(4, -42, 9, 8);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(-32, -36, 18, 3);
  ctx.restore();
}

/** Draws a thing standing on the ground. */
export function drawThing(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  switch (thing.kind) {
    case 'tree':
      return drawTree(ctx, thing);
    case 'town-tree':
      return drawTownTree(ctx, thing, time);
    case 'lamp':
      return drawLamp(ctx, thing, time);
    case 'fence':
      return drawFence(ctx, thing);
    case 'cabin':
      return drawCabin(ctx, thing, time);
    case 'stable':
      return drawStable(ctx, thing, time);
    case 'sleigh':
      return drawSleigh(ctx, thing);
    case 'drift':
      return drawDrift(ctx, thing);
    case 'wheel':
      return drawWheel(ctx, thing, time);
    case 'tent':
      return drawTent(ctx, thing, time);
    case 'bench':
      return drawBench(ctx, thing);
    case 'cart':
      return drawCart(ctx, thing, time);
    case 'arch':
      return drawArch(ctx, thing, time);
    case 'banner':
      return drawBanner(ctx, thing, time);
    case 'bunting':
      return drawBunting(ctx, thing, time);
  }
}

/** One of a plot's faces we see: its ends on the ground, left to right on screen, and a tile's step outwards. */
export interface Face {
  a: Tile;
  b: Tile;
  out: Tile;
}

/**
 * The face of a plot its square's drawing goes on: the one its door is on, or,
 * when the door is round the back, the face we see on the same side.
 */
export function faceOf(plot: Box & { door: Tile }): Face {
  const c = corners(plot);
  const sideways = plot.door.x >= plot.x + plot.w || plot.door.x < plot.x;
  return sideways
    ? { a: c.bottom, b: c.right, out: { x: TILE_W / 2, y: TILE_H / 2 } }
    : { a: c.left, b: c.bottom, out: { x: -TILE_W / 2, y: TILE_H / 2 } };
}

/** The point `along` the way across a face, `lift` up it and `outward` tiles out from it. */
export function onFace(face: Face, along: number, lift: number, outward = 0): Tile {
  return {
    x: face.a.x + (face.b.x - face.a.x) * along + face.out.x * outward,
    y: face.a.y + (face.b.y - face.a.y) * along + face.out.y * outward - lift,
  };
}

function quad(ctx: CanvasRenderingContext2D, points: Tile[]) {
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
}

/** A strip of a face from `from` to `to` across it, `low` to `high` up it, `outward` tiles out. */
function band(
  ctx: CanvasRenderingContext2D,
  face: Face,
  from: number,
  to: number,
  low: number,
  high: number,
  outward = 0,
) {
  quad(ctx, [
    onFace(face, from, high, outward),
    onFace(face, to, high, outward),
    onFace(face, to, low, outward),
    onFace(face, from, low, outward),
  ]);
}

/**
 * Where a square's drawing goes on a face: a parallelogram whose top edge runs
 * along the face and whose sides stand upright. `u` and `v` are its top and
 * left edges from `origin`, its top-left corner.
 */
export interface Mapping {
  origin: Tile;
  u: Tile;
  v: Tile;
}

/** What draws a square onto a face of the world: the map's own `drawSquare`, through an affine transform. */
export type PaintSquare = (square: NorthPoleSquare, mapping: Mapping) => void;

/** Paints text along a face, the way a shop sign follows its wall, centred on `along` at height `lift`. */
function faceText(
  ctx: CanvasRenderingContext2D,
  face: Face,
  text: string,
  along: number,
  lift: number,
  width: number,
  font: string,
  color: string,
  outward = 0,
) {
  const at = onFace(face, along, lift, outward);
  const slope = (face.b.y - face.a.y) / (face.b.x - face.a.x);
  ctx.save();
  ctx.transform(1, slope, 0, 1, at.x, at.y);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  // A long name shrinks a little, then is shortened with an ellipsis: its tag shows it whole.
  let shown = text;
  const fit = Math.max(MIN_TEXT_SCALE, Math.min(1, width / ctx.measureText(text).width));
  const chars = Array.from(text);
  while (chars.length > 1 && ctx.measureText(shown).width * fit > width) {
    chars.pop();
    shown = `${chars.join('').trimEnd()}…`;
  }
  ctx.scale(fit, fit);
  ctx.fillText(shown, 0, 0);
  ctx.restore();
}

/** The smallest a sign's text shrinks to before it's shortened instead. */
const MIN_TEXT_SCALE = 0.8;

/**
 * Who owns a booth, as its stall shows it: their colour on the pennant and the
 * sign's trim, their avatar on the sign (undefined for the elf fallback), and
 * whether they are the visitor, whose own booth says "You".
 */
export interface Owner {
  color: string;
  avatar?: CanvasImageSource;
  you: boolean;
}

/**
 * A round portrait of radius `r` at (0, 0), in whatever transform the caller
 * set: the owner's avatar, or an elf's silhouette when there is none.
 */
export function portrait(ctx: CanvasRenderingContext2D, r: number, avatar?: CanvasImageSource) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = colors.pine;
  ctx.fill();
  ctx.clip();
  if (avatar) {
    ctx.drawImage(avatar, -r, -r, r * 2, r * 2);
  } else {
    // The elf: a head, a pointed hat with its tip falling to one side, and shoulders.
    ctx.fillStyle = colors.snowShade;
    ctx.beginPath();
    ctx.arc(0, r * 0.05, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, r * 0.95, r * 0.7, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.berry;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.12);
    ctx.lineTo(r * 0.4, -r * 0.12);
    ctx.quadraticCurveTo(r * 0.2, -r * 0.6, r * 0.55, -r * 0.7);
    ctx.quadraticCurveTo(-r * 0.05, -r * 0.75, -r * 0.4, -r * 0.12);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = Math.max(1, r / 6);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * A name board along a face: the name, and whose it is under it, or the name
 * alone when `by` is empty. A booth's board has its owner's portrait at the
 * left and a trim in their colour.
 */
function faceSign(
  ctx: CanvasRenderingContext2D,
  face: Face,
  low: number,
  high: number,
  name: string,
  by: string,
  outward = 0,
  owner?: Owner,
) {
  const width = Math.abs(face.b.x - face.a.x);
  ctx.fillStyle = colors.cocoa;
  band(ctx, face, 0.04, 0.96, low, high, outward);
  ctx.fill();
  if (owner) {
    ctx.fillStyle = owner.color;
    band(ctx, face, 0.055, 0.945, low + 1, high - 1, outward);
    ctx.fill();
  }
  ctx.fillStyle = colors.cream;
  band(ctx, face, 0.07, 0.93, low + 2.5, high - 2.5, outward);
  ctx.fill();
  const line = (high - low) / 2;
  // With a portrait, the words move right of it.
  const r = Math.min(line - 3.5, width * 0.09);
  const pictured = owner && r > 2;
  const along = pictured ? 0.58 : 0.5;
  const room = pictured ? width * 0.62 : width * 0.8;
  if (pictured) {
    const at = onFace(face, 0.08 + r / width + 0.02, low + line, outward);
    const slope = (face.b.y - face.a.y) / (face.b.x - face.a.x);
    ctx.save();
    ctx.transform(1, slope, 0, 1, at.x, at.y);
    portrait(ctx, r, owner.avatar);
    ctx.restore();
  }
  faceText(
    ctx,
    face,
    name,
    along,
    by ? high - line * 0.62 : low + line,
    room,
    canvasFont('small', 'bold'),
    colors.ink,
    outward,
  );
  if (!by) return;
  faceText(
    ctx,
    face,
    by,
    along,
    low + line * 0.5,
    room,
    canvasFont('small'),
    colors.berry,
    outward,
  );
}

/** Maps a square onto a face, from `from` to `to` across it and `low` up it, as tall as it is wide on screen. */
function paintOnFace(
  paint: PaintSquare,
  square: NorthPoleSquare,
  face: Face,
  from: number,
  to: number,
  low: number,
  outward = 0,
) {
  const left = onFace(face, from, 0, outward);
  const right = onFace(face, to, 0, outward);
  const tall = Math.abs(right.x - left.x);
  paint(square, {
    origin: { x: left.x, y: left.y - low - tall },
    u: { x: right.x - left.x, y: right.y - left.y },
    v: { x: 0, y: tall },
  });
}

/** How tall each part of a booth's stall is, in world pixels. */
const STALL = { counter: 16, art: 18, wall: 104 };
/** How tall each part of an attraction's pavilion is. */
const PAVILION = { stage: 10, art: 24, wall: 150, roof: 64 };

/** Where a click opens a plot: round everything standing on it. */
function standing(plot: Box, height: number): Box {
  const c = corners(plot);
  return {
    x: c.left.x,
    y: c.top.y - height,
    w: c.right.x - c.left.x,
    h: c.bottom.y - c.top.y + height,
  };
}

/** A point on a stall's plot, `along` its front from 0 to 1, left to right, and `depth` back from it, 0 to 1. */
export interface OnPlot {
  along: number;
  depth: number;
}

/** The ground outline of each stall shape, on its plot, round it in order. */
export function stallOutline(shape: StallShape): OnPlot[] {
  const ring = (sides: number, radius: number, turn: number) =>
    Array.from({ length: sides }, (_, n) => {
      const angle = turn + (n / sides) * Math.PI * 2;
      return { along: 0.5 + Math.cos(angle) * radius, depth: 0.5 + Math.sin(angle) * radius };
    });
  switch (shape) {
    case 'tent':
      return ring(20, 0.46, 0);
    case 'kiosk':
      // Flat to the front, so the drawing's board stands against one side.
      return ring(6, 0.46, 0);
    default:
      return [
        { along: 0, depth: 0 },
        { along: 1, depth: 0 },
        { along: 1, depth: 1 },
        { along: 0, depth: 1 },
      ];
  }
}

/** How tall each stall shape's walls are, and how high its roof rises over them, in world pixels. */
export const STALL_SHAPES_DRAWN: Record<StallShape, { wall: number; roof: number }> = {
  stall: { wall: STALL.wall, roof: 25 },
  shed: { wall: STALL.wall, roof: 10 },
  tent: { wall: STALL.wall - 24, roof: 70 },
  cabin: { wall: STALL.wall, roof: 46 },
  kiosk: { wall: STALL.wall - 16, roof: 56 },
};

/** The colours a stall is drawn in: its shape, its roof, and its trim for stripes and the awning. */
export function stallLook(stall: StallStyle | undefined): {
  shape: StallShape;
  roof: string;
  trim: string;
} {
  if (!stall) return { shape: 'stall', roof: colors.berry, trim: colors.snow };
  const trim = stall.trim ?? (stall.shape === 'shed' || stall.shape === 'kiosk' ? 'cream' : 'snow');
  return { shape: stall.shape, roof: colors[stall.roof], trim: colors[trim] };
}

/** Where a point on a stall's plot is on screen, `lift` up. */
function plotPoint(face: Face, deep: number, at: OnPlot, lift = 0): Tile {
  return onFace(face, at.along, lift, -at.depth * deep);
}

/** A side's colour: one for every side, or one for side `n` of the outline. */
type SideColor = string | ((n: number) => string);

/**
 * Upright walls round a ground outline, `height` high from `lift`: the sides
 * we see, lit on the left and shaded on the right, then the top. With `dim`,
 * the shaded sides are their own colour under the dusk's shadow.
 */
function prism(
  ctx: CanvasRenderingContext2D,
  ground: Tile[],
  height: number,
  top: string | undefined,
  lit: SideColor,
  shaded: SideColor,
  lift = 0,
  dim = false,
) {
  const colorOf = (color: SideColor, n: number) => (typeof color === 'string' ? color : color(n));
  const centre = {
    x: ground.reduce((sum, p) => sum + p.x, 0) / ground.length,
    y: ground.reduce((sum, p) => sum + p.y, 0) / ground.length,
  };
  ground.forEach((p, n) => {
    const q = ground[(n + 1) % ground.length];
    // The side's outward normal on screen: one facing down the screen faces us.
    let normal = { x: q.y - p.y, y: p.x - q.x };
    const mid = { x: (p.x + q.x) / 2 - centre.x, y: (p.y + q.y) / 2 - centre.y };
    if (normal.x * mid.x + normal.y * mid.y < 0) normal = { x: -normal.x, y: -normal.y };
    if (normal.y <= 0) return;
    const isLit = normal.x < 0;
    ctx.fillStyle = colorOf(isLit ? lit : shaded, n);
    quad(ctx, [
      { x: p.x, y: p.y - lift },
      { x: q.x, y: q.y - lift },
      { x: q.x, y: q.y - lift - height },
      { x: p.x, y: p.y - lift - height },
    ]);
    ctx.fill();
    if (dim && !isLit) {
      ctx.fillStyle = colors.night;
      ctx.globalAlpha = 0.22;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
  if (!top) return;
  ctx.fillStyle = top;
  quad(
    ctx,
    ground.map((p) => ({ x: p.x, y: p.y - lift - height })),
  );
  ctx.fill();
}

/** A pointed roof over a ground outline, from `height` up to a peak `rise` higher, its slopes in `pair` by turns. */
function peakedRoof(
  ctx: CanvasRenderingContext2D,
  ground: Tile[],
  height: number,
  rise: number,
  pair: readonly string[],
) {
  const centre = {
    x: ground.reduce((sum, p) => sum + p.x, 0) / ground.length,
    y: ground.reduce((sum, p) => sum + p.y, 0) / ground.length,
  };
  const peak = { x: centre.x, y: centre.y - height - rise };
  const slopes = ground.map((p, n) => ({ p, q: ground[(n + 1) % ground.length], n }));
  // Back to front, so the slopes facing us cover the ones behind.
  slopes.sort((a, b) => a.p.y + a.q.y - (b.p.y + b.q.y));
  for (const { p, q, n } of slopes) {
    ctx.fillStyle = pair[n % pair.length];
    quad(ctx, [peak, { x: p.x, y: p.y - height }, { x: q.x, y: q.y - height }]);
    ctx.fill();
    if ((p.x + q.x) / 2 > centre.x) {
      ctx.fillStyle = colors.night;
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

/** The front of a stall: a frame round the drawing, the drawing itself, and the name board over it. */
function stallFront(
  ctx: CanvasRenderingContext2D,
  face: Face,
  square: NorthPoleSquare,
  paint: PaintSquare,
  owner: Owner,
) {
  const width = Math.abs(face.b.x - face.a.x);
  const art = width * 0.84;
  ctx.fillStyle = colors.cocoa;
  band(ctx, face, 0.05, 0.95, STALL.art - 3, STALL.art + art + 3);
  ctx.fill();
  paintOnFace(paint, square, face, 0.08, 0.92, STALL.art);
  const signLow = stallSignLow(face);
  faceSign(ctx, face, signLow, STALL.wall - 2, square.name, `by @${square.id}`, 0, owner);
}

/** Where a stall's name board starts, just over the drawing on its front. */
function stallSignLow(face: Face): number {
  return STALL.art + Math.abs(face.b.x - face.a.x) * 0.84 + 5;
}

/** The counter, standing out in front of the drawing. */
function stallCounter(ctx: CanvasRenderingContext2D, plot: Plot, face: Face) {
  const counter: Box =
    face.out.x > 0
      ? { x: plot.x + plot.w, y: plot.y, w: 0.3, h: plot.h }
      : { x: plot.x, y: plot.y + plot.h, w: plot.w, h: 0.3 };
  block(ctx, counter, STALL.counter, colors.gingerbread, colors.wood, colors.cocoa);
}

/**
 * A booth's stall: its square on the front, framed, with the name board over
 * it, in the shape and colours the booth chose, or a market stall with a
 * striped awning. Every shape stands on its plot, so the door and the depth
 * order stay the same.
 */
function drawStall(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  square: NorthPoleSquare,
  paint: PaintSquare,
  time: number,
  owner: Owner,
): Box {
  const { x, y } = middle(plot);
  const face = faceOf(plot);
  const deep = face.out.x > 0 ? plot.w : plot.h;
  const look = stallLook(square.stall);
  const { wall, roof } = STALL_SHAPES_DRAWN[look.shape];
  const ground = stallOutline(look.shape).map((at) => plotPoint(face, deep, at));
  shadow(ctx, x, y + 6, 48);
  switch (look.shape) {
    case 'stall':
      block(ctx, plot, wall, colors.snowShade, colors.wood, colors.cocoa);
      stallFront(ctx, face, square, paint, owner);
      stallCounter(ctx, plot, face);
      awning(ctx, face, look.roof, look.trim);
      break;
    case 'shed': {
      prism(ctx, ground, wall, undefined, colors.wood, colors.cocoa);
      // Planks along the walls.
      ctx.fillStyle = colors.cocoa;
      for (let k = 1; k < 5; k++) {
        band(ctx, face, 0, 1, (wall * k) / 5, (wall * k) / 5 + 1);
        ctx.fill();
      }
      stallFront(ctx, face, square, paint, owner);
      // A flat roof hanging a little over the walls, with snow along its back.
      const eaves = stallOutline('shed').map((at) =>
        plotPoint(face, deep, {
          along: (at.along - 0.5) * 1.08 + 0.5,
          depth: (at.depth - 0.5) * 1.08 + 0.5,
        }),
      );
      prism(ctx, eaves, roof, look.roof, look.trim, colors.cocoa, wall);
      ctx.fillStyle = colors.snow;
      ctx.globalAlpha = 0.85;
      quad(
        ctx,
        [
          { along: -0.04, depth: 1.04 },
          { along: 1.04, depth: 1.04 },
          { along: 1.04, depth: 0.7 },
          { along: -0.04, depth: 0.78 },
        ].map((at) => plotPoint(face, deep, at, wall + roof)),
      );
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case 'tent': {
      // Canvas walls in stripes, a striped cone over them, and the front on a board.
      const stripe = (n: number) => (n % 2 ? look.trim : look.roof);
      prism(ctx, ground, wall, undefined, stripe, stripe, 0, true);
      peakedRoof(ctx, ground, wall, roof, [look.roof, look.trim]);
      ctx.fillStyle = colors.cocoa;
      band(ctx, face, 0.03, 0.97, 0, STALL.wall);
      ctx.fill();
      stallFront(ctx, face, square, paint, owner);
      pennant(ctx, plotPoint(face, deep, { along: 0.5, depth: 0.5 }, wall + roof), look.trim);
      break;
    }
    case 'cabin': {
      block(ctx, plot, wall, colors.snowShade, colors.wood, colors.cocoa);
      // Logs along the walls, a round end on each at the front corners.
      for (let k = 0; k < 8; k++) {
        const lift = (wall * (k + 0.5)) / 8;
        ctx.fillStyle = colors.cocoa;
        for (const [from, to] of [
          [face.a, face.b],
          [face.b, plotPoint(face, deep, { along: 1, depth: 1 })],
        ]) {
          quad(ctx, [
            { x: from.x, y: from.y - lift },
            { x: to.x, y: to.y - lift },
            { x: to.x, y: to.y - lift - 1.5 },
            { x: from.x, y: from.y - lift - 1.5 },
          ]);
          ctx.fill();
        }
        ctx.fillStyle = colors.gingerbread;
        for (const end of [face.a, face.b]) {
          ctx.beginPath();
          ctx.arc(end.x, end.y - lift, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      stallFront(ctx, face, square, paint, owner);
      cabinRoof(ctx, face, deep, wall, roof, look.roof);
      break;
    }
    case 'kiosk': {
      prism(ctx, ground, wall, undefined, look.trim, colors.cocoa);
      const eaves = stallOutline('kiosk').map((at) =>
        plotPoint(face, deep, {
          along: (at.along - 0.5) * 1.15 + 0.5,
          depth: (at.depth - 0.5) * 1.15 + 0.5,
        }),
      );
      prism(ctx, eaves, 6, undefined, look.trim, colors.snowShade, wall);
      peakedRoof(ctx, eaves, wall + 6, roof, [look.roof]);
      const peak = plotPoint(face, deep, { along: 0.5, depth: 0.5 }, wall + 6 + roof);
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.arc(peak.x, peak.y - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      // The front on a board after the roof, so the name board stands in front of the eaves, as on the tent.
      ctx.fillStyle = colors.cocoa;
      band(ctx, face, 0.03, 0.97, 0, STALL.wall);
      ctx.fill();
      stallFront(ctx, face, square, paint, owner);
      stallCounter(ctx, plot, face);
      break;
    }
  }
  // An Elf Engineer's pin, on the right end of the name board, over whatever shape the stall is.
  const badge = badgeFor(square.id);
  if (badge) {
    const signLow = stallSignLow(face);
    const pin = onFace(face, 0.94, (signLow + STALL.wall - 2) / 2, 0.1);
    drawElfHatPin(ctx, pin.x, pin.y, (STALL.wall - 2 - signLow) * 0.42, badge.tier);
  }
  // A People's Choice trophy for the top three, standing on the name board's left end, clear of the portrait.
  const place = trophyFor(square.id, PEOPLES_CHOICE);
  if (place) {
    const r = (STALL.wall - 2 - stallSignLow(face)) * 0.42;
    const cup = onFace(face, 0.12, STALL.wall - 2 + r, 0.1);
    drawTrophy(ctx, cup.x, cup.y, r, place);
  }
  // The owner's pennant, on a pole at the front's far corner, over whatever shape the stall is.
  const top = look.shape === 'stall' ? STALL.wall + 22 : wall;
  const foot = onFace(face, 0.96, top, look.shape === 'stall' ? -0.5 : 0);
  const pole = 30;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x - 1, foot.y - pole, 2, pole);
  const wave = Math.sin(time / 500 + plot.number) * 2;
  ctx.fillStyle = owner.color;
  quad(ctx, [
    { x: foot.x + 1, y: foot.y - pole },
    { x: foot.x + 20, y: foot.y - pole + 6 + wave },
    { x: foot.x + 1, y: foot.y - pole + 12 },
  ]);
  ctx.fill();
  const reach = Math.max(stallReach(look.shape), top + pole);
  if (owner.you) youTag(ctx, onFace(face, 0.5, reach + 8, -0.5));
  return standing(plot, reach + (owner.you ? 22 : 0));
}

/** How high a stall of `shape` reaches over its plot, with its awning, pennant or finial. */
export function stallReach(shape: StallShape): number {
  const { wall, roof } = STALL_SHAPES_DRAWN[shape];
  const extra = shape === 'tent' ? 20 : shape === 'kiosk' ? 14 : 5;
  return Math.max(STALL.wall, wall + roof) + extra;
}

/** The market stall's awning, striped, sloping out over the counter, with a scalloped edge and snow on top. */
function awning(ctx: CanvasRenderingContext2D, face: Face, roof: string, trim: string) {
  const width = Math.abs(face.b.x - face.a.x);
  const stripes = 8;
  for (let n = 0; n < stripes; n++) {
    ctx.fillStyle = n % 2 ? trim : roof;
    quad(ctx, [
      onFace(face, n / stripes, STALL.wall + 22, -0.5),
      onFace(face, (n + 1) / stripes, STALL.wall + 22, -0.5),
      onFace(face, (n + 1) / stripes, STALL.wall - 4, 0.45),
      onFace(face, n / stripes, STALL.wall - 4, 0.45),
    ]);
    ctx.fill();
    const scallop = onFace(face, (n + 0.5) / stripes, STALL.wall - 4, 0.45);
    ctx.beginPath();
    ctx.ellipse(scallop.x, scallop.y, width / stripes / 2, 4, 0, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = colors.snow;
  band(ctx, face, -0.02, 1.02, STALL.wall + 20, STALL.wall + 25, -0.5);
  ctx.fill();
}

/** The "You" tag over the visitor's own booth, centred on `at`. */
function youTag(ctx: CanvasRenderingContext2D, at: Tile) {
  const w = 40;
  const h = 20;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(at.x - w / 2 - 2, at.y - h / 2 - 2, w + 4, h + 4);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(at.x - w / 2, at.y - h / 2, w, h);
  ctx.fillStyle = colors.ink;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('You', at.x, at.y + 1, w - 4);
  ctx.textBaseline = 'alphabetic';
}

/** A small flag on a pole, rising from `at`. */
function pennant(ctx: CanvasRenderingContext2D, at: Tile, color: string) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(at.x - 1, at.y - 18, 2, 18);
  ctx.fillStyle = color;
  quad(ctx, [
    { x: at.x + 1, y: at.y - 18 },
    { x: at.x + 13, y: at.y - 14 },
    { x: at.x + 1, y: at.y - 10 },
  ]);
  ctx.fill();
}

/**
 * The cabin's pitched roof: its ridge running back from the front, a gable
 * over the name board, and the slopes in `color` under a coat of snow.
 */
function cabinRoof(
  ctx: CanvasRenderingContext2D,
  face: Face,
  deep: number,
  wall: number,
  rise: number,
  color: string,
) {
  const at = (along: number, depth: number, lift: number) =>
    plotPoint(face, deep, { along, depth }, lift);
  const over = 0.08;
  const eave = wall - 6;
  /** One slope, from the ridge down to the eave on side `side` of the front, with snow on its upper part. */
  const slope = (side: 0 | 1) => {
    const edge = side ? 1 + over : -over;
    const down = (t: number) => ({
      along: 0.5 + (edge - 0.5) * t,
      lift: wall + rise + (eave - wall - rise) * t,
    });
    const strip = (from: number, to: number) => {
      const [p, q] = [down(from), down(to)];
      quad(ctx, [
        at(p.along, -over, p.lift),
        at(p.along, 1 + over, p.lift),
        at(q.along, 1 + over, q.lift),
        at(q.along, -over, q.lift),
      ]);
    };
    ctx.fillStyle = color;
    strip(0, 1);
    ctx.fill();
    ctx.fillStyle = colors.snow;
    strip(0, 0.45);
    ctx.fill();
    if (!side) return;
    // The slope facing right is in the dusk's shadow.
    ctx.fillStyle = colors.night;
    ctx.globalAlpha = 0.18;
    strip(0, 1);
    ctx.fill();
    ctx.globalAlpha = 1;
  };
  // The far slope first, then the gable end in logs over it, then the near slope.
  const near = face.out.x > 0 ? 0 : 1;
  slope(near === 0 ? 1 : 0);
  ctx.fillStyle = colors.wood;
  quad(ctx, [at(0, 0, wall), at(1, 0, wall), at(0.5, 0, wall + rise)]);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  for (let k = 1; k < 4; k++) {
    const lift = wall + (rise * k) / 4;
    const half = 0.5 * (1 - k / 4);
    quad(ctx, [
      at(0.5 - half, 0, lift),
      at(0.5 + half, 0, lift),
      at(0.5 + half, 0, lift + 1.5),
      at(0.5 - half, 0, lift + 1.5),
    ]);
    ctx.fill();
  }
  slope(near);
}

/** The pom-pom of an Elf Engineer's hat, by tier. */
const POM_POMS: Record<BadgeTier | 'none', string> = {
  none: colors.snow,
  bronze: colors.gingerbread,
  silver: colors.snowShade,
  gold: colors.gold,
};

/** An Elf Engineer's pin: a round gold badge with an elf's hat on it, `radius` across from its middle. */
export function drawElfHatPin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  tier?: BadgeTier,
) {
  const r = radius;
  ctx.save();
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // The hat: a red cone curling to the right, a snowy brim and a pom-pom.
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.62, y + r * 0.35);
  ctx.quadraticCurveTo(x - r * 0.2, y - r * 0.95, x + r * 0.5, y - r * 0.55);
  ctx.lineTo(x + r * 0.62, y + r * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - r * 0.72, y + r * 0.25, r * 1.44, r * 0.34);
  ctx.fillStyle = POM_POMS[tier ?? 'none'];
  ctx.beginPath();
  ctx.arc(x + r * 0.55, y - r * 0.55, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A trophy's metal, by place. */
const TROPHIES: Record<1 | 2 | 3, string> = {
  1: colors.gold,
  2: colors.snowShade,
  3: colors.gingerbread,
};

/** A People's Choice trophy: a cup with two handles on a stand, `radius` across from its middle. */
export function drawTrophy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  place: 1 | 2 | 3,
) {
  const r = radius;
  ctx.save();
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = TROPHIES[place];
  ctx.strokeStyle = TROPHIES[place];
  ctx.lineWidth = Math.max(1, r * 0.16);
  // The cup, its handles, the stem and the base.
  ctx.beginPath();
  ctx.moveTo(x - r * 0.55, y - r * 0.6);
  ctx.lineTo(x + r * 0.55, y - r * 0.6);
  ctx.quadraticCurveTo(x + r * 0.5, y + r * 0.1, x, y + r * 0.15);
  ctx.quadraticCurveTo(x - r * 0.5, y + r * 0.1, x - r * 0.55, y - r * 0.6);
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * r * 0.55, y - r * 0.3, r * 0.22, -Math.PI / 2, Math.PI / 2, side < 0);
    ctx.stroke();
  }
  ctx.fillRect(x - r * 0.08, y + r * 0.1, r * 0.16, r * 0.3);
  ctx.fillRect(x - r * 0.35, y + r * 0.4, r * 0.7, r * 0.2);
  ctx.restore();
}

const ROOFS = [
  [colors.berry, colors.snow],
  [colors.pine, colors.cream],
  [colors.violet, colors.cream],
  [colors.gingerbread, colors.snow],
];

/** A pyramid roof in candy stripes over a box, from `height` up to its peak `rise` higher. */
function stripedRoof(
  ctx: CanvasRenderingContext2D,
  box: Box,
  height: number,
  rise: number,
  pair: readonly string[],
  time: number,
) {
  const c = corners(box);
  const { x, y } = middle(box);
  const peak = { x, y: y - height - rise };
  const lift = (p: Tile) => ({ x: p.x, y: p.y - height });
  const stripes = 6;
  for (const [n, [from, to]] of [
    [c.left, c.bottom],
    [c.bottom, c.right],
  ].entries()) {
    for (let k = 0; k < stripes; k++) {
      const p = (t: number) =>
        lift({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
      ctx.fillStyle = pair[k % 2];
      quad(ctx, [peak, p(k / stripes), p((k + 1) / stripes)]);
      ctx.fill();
    }
    if (n) {
      ctx.fillStyle = colors.night;
      ctx.globalAlpha = 0.18;
      quad(ctx, [peak, lift(from), lift(to)]);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  // Lights along the eaves, and a pennant on top.
  for (const [from, to] of [
    [c.left, c.bottom],
    [c.bottom, c.right],
  ])
    for (let k = 0; k <= 8; k++) {
      const at = lift({
        x: from.x + ((to.x - from.x) * k) / 8,
        y: from.y + ((to.y - from.y) * k) / 8,
      });
      bulb(ctx, at.x, at.y + 2, colors.lantern, twinkle(time, at.x + at.y));
    }
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(peak.x - 1, peak.y - 18, 2, 18);
  ctx.fillStyle = colors.gold;
  quad(ctx, [
    { x: peak.x + 1, y: peak.y - 18 },
    { x: peak.x + 14, y: peak.y - 14 + Math.sin(time / 400) * 2 },
    { x: peak.x + 1, y: peak.y - 10 },
  ]);
  ctx.fill();
}

/** How bright a string light is at `time`: most of them glow, and now and then one dips. */
export function twinkle(time: number, seed: number) {
  return 0.65 + 0.35 * Math.sin(time / 420 + seed * 1.7) * Math.sin(time / 1300 + seed * 0.3);
}

/** One warm light bulb with its glow. */
function bulb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  strength: number,
) {
  ctx.globalAlpha = 0.25 * strength;
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = strength;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** One of the North Pole's attractions: a pavilion on a stage, its square on the front and a striped roof. */
function drawAttraction(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  square: NorthPoleSquare,
  paint: PaintSquare,
  time: number,
): Box {
  const { x, y } = middle(plot);
  shadow(ctx, x, y + 8, 80);
  block(ctx, plot, PAVILION.stage, colors.snowShade, colors.surface, colors.night);
  const inner = { x: plot.x + 0.2, y: plot.y + 0.2, w: plot.w - 0.4, h: plot.h - 0.4 };
  const face = faceOf({ ...inner, door: plot.door });
  const width = Math.abs(face.b.x - face.a.x);
  block(ctx, inner, PAVILION.wall, colors.cream, colors.surface, colors.night);
  // Gold posts at the corners of the front.
  ctx.fillStyle = colors.gold;
  for (const along of [0, 1]) {
    const foot = onFace(face, along, 0);
    ctx.fillRect(foot.x - 3, foot.y - PAVILION.wall, 6, PAVILION.wall);
  }
  const art = width * 0.84;
  ctx.fillStyle = colors.gold;
  band(ctx, face, 0.05, 0.95, PAVILION.art - 4, PAVILION.art + art + 4);
  ctx.fill();
  paintOnFace(paint, square, face, 0.08, 0.92, PAVILION.art);
  faceSign(ctx, face, PAVILION.art + art + 8, PAVILION.wall - 4, square.name, '');
  const eaves = { x: inner.x - 0.25, y: inner.y - 0.25, w: inner.w + 0.5, h: inner.h + 0.5 };
  stripedRoof(ctx, eaves, PAVILION.wall, PAVILION.roof, ROOFS[plot.number % ROOFS.length], time);
  return standing(plot, PAVILION.wall + PAVILION.roof + 20);
}

/** The "For claim" sign on an open plot: how tall its post is, and its board's size, in world pixels. */
export const CLAIM_SIGN = { post: 96, w: 128, h: 40 };

/**
 * An open plot: a square of fresh snow roped off between stakes, a soft beam
 * of light rising from it, and a big "For claim" sign on a tall post. The sign
 * bounces while the player stands at the plot. Everything moves with `time`,
 * so it all stands still when the map passes 0.
 */
function drawOpenPlot(ctx: CanvasRenderingContext2D, plot: Plot, time: number, near: boolean): Box {
  const c = corners(plot);
  const { x, y } = middle(plot);
  const pulse = 0.75 + 0.25 * Math.sin(time / 700 + plot.number);
  // The beam: a column of warm light fading upwards, over a glow on the snow.
  ctx.save();
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.35 * pulse;
  diamond(ctx, c, 0);
  ctx.fill();
  const beam = ctx.createLinearGradient(0, y, 0, y - 190);
  beam.addColorStop(0, colors.glow);
  beam.addColorStop(1, `${colors.glow}00`);
  ctx.fillStyle = beam;
  ctx.globalAlpha = 0.4 * pulse;
  ctx.beginPath();
  ctx.moveTo(c.left.x + 10, c.left.y);
  ctx.lineTo(c.bottom.x, c.bottom.y);
  ctx.lineTo(c.right.x - 10, c.right.y);
  ctx.lineTo(c.right.x - 22, c.right.y - 190);
  ctx.lineTo(c.left.x + 22, c.left.y - 190);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // The rope, sagging a little between its stakes.
  const stakes = [c.top, c.right, c.bottom, c.left];
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  stakes.forEach((p, n) => {
    const q = stakes[(n + 1) % 4];
    ctx.moveTo(p.x, p.y - 14);
    ctx.quadraticCurveTo((p.x + q.x) / 2, (p.y + q.y) / 2 - 8, q.x, q.y - 14);
  });
  ctx.stroke();
  for (const p of stakes) {
    ctx.fillStyle = colors.wood;
    ctx.fillRect(p.x - 2, p.y - 18, 4, 18);
    ctx.fillStyle = colors.berry;
    ctx.fillRect(p.x - 2, p.y - 18, 4, 4);
  }
  // The sign on its tall post, bouncing for the player who stands at it.
  const { post, w, h } = CLAIM_SIGN;
  const lift = near
    ? Math.abs(Math.sin(time / 180)) * 10
    : Math.sin(time / 900 + plot.number) * 1.5;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 3, y - post, 6, post);
  const top = y - post - h / 2 - lift;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - w / 2 - 3, top - 3, w + 6, h + 6);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - w / 2, top, w, h);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - w / 2 - 4, top - 6, w + 8, 5);
  ctx.fillStyle = colors.ink;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('For claim', x, top + h / 2, w - 12);
  ctx.textBaseline = 'alphabetic';
  const reach = post + h / 2 + 16;
  return { x: x - w / 2 - 8, y: y - reach, w: w + 16, h: reach + 24 };
}

/** A booth being built: who it's for, and how far along it is, already in words. */
export interface SiteLabel {
  login: string;
  stage: string;
}

/** The construction site's scaffolding height, and its sign's post and board, in world pixels. */
export const SITE = { scaffold: 84, post: 34, w: 132, h: 44 };

/** A wooden pole from `foot` up `height`. */
function pole(ctx: CanvasRenderingContext2D, foot: Tile, height: number) {
  ctx.fillStyle = colors.wood;
  ctx.fillRect(foot.x - 2, foot.y - height, 4, height);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x, foot.y - height, 2, height);
}

/** A plank from `a` to `b`, both `lift` above the ground. */
function plank(ctx: CanvasRenderingContext2D, a: Tile, b: Tile, lift: number) {
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y - lift);
  ctx.lineTo(b.x, b.y - lift);
  ctx.stroke();
}

/**
 * The construction site of a booth being built: trampled snow, scaffolding
 * with a plank floor, a few crates, a little elf with a hammer, and a sign
 * with `@login` and how far along it is. The hammer swings gently with
 * `time`, so it stands still when the map passes 0. Returns where a click
 * opens it.
 */
export function drawSite(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  label: SiteLabel,
  time: number,
  near = false,
): Box {
  const c = corners(plot);
  const { x, y } = middle(plot);
  shadow(ctx, x, y + 6, 70);
  // Trampled snow, roped off like an open plot.
  ctx.fillStyle = colors.snowShade;
  diamond(ctx, c, 0);
  ctx.fill();
  const inner = { x: plot.x + 0.3, y: plot.y + 0.2, w: plot.w - 0.75, h: plot.h - 0.75 };
  const s = corners(inner);
  const { scaffold } = SITE;
  // The back of the scaffolding, then its floor, then its front.
  for (const foot of [s.left, s.top, s.right]) pole(ctx, foot, scaffold);
  for (const lift of [scaffold * 0.45, scaffold - 4]) {
    plank(ctx, s.left, s.top, lift);
    plank(ctx, s.top, s.right, lift);
  }
  ctx.fillStyle = colors.gingerbread;
  diamond(ctx, s, scaffold * 0.45);
  ctx.fill();
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 1;
  ctx.stroke();
  pole(ctx, s.bottom, scaffold);
  for (const lift of [scaffold * 0.45, scaffold - 4]) {
    plank(ctx, s.left, s.bottom, lift);
    plank(ctx, s.bottom, s.right, lift);
  }
  // A brace across each front face.
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.left.x, s.left.y);
  ctx.lineTo(s.bottom.x, s.bottom.y - scaffold * 0.45);
  ctx.moveTo(s.bottom.x, s.bottom.y);
  ctx.lineTo(s.right.x, s.right.y - scaffold * 0.45);
  ctx.stroke();
  // Crates stacked by the front.
  const crate = (box: Box, lift = 0) =>
    block(ctx, box, 12, colors.gingerbread, colors.wood, colors.cocoa, lift);
  crate({ x: plot.x + plot.w - 0.95, y: plot.y + 0.05, w: 0.4, h: 0.4 });
  crate({ x: plot.x + plot.w - 0.95, y: plot.y + 0.5, w: 0.4, h: 0.4 });
  crate({ x: plot.x + plot.w - 0.95, y: plot.y + 0.25, w: 0.4, h: 0.4 }, 12);
  // The elf at work, swinging a hammer.
  const elf = { x: plot.x + plot.w - 0.75, y: plot.y + plot.h - 0.95 };
  drawPerson(ctx, elf, { coat: colors.pine, hat: colors.berry, scale: 0.8 }, -1, false, 0);
  const hand = toScreen(elf);
  const swing = -0.5 + 0.45 * Math.sin(time / 320);
  ctx.save();
  ctx.translate(hand.x - 4, hand.y - 18);
  ctx.rotate(swing);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(-1.5, -14, 3, 14);
  ctx.fillStyle = colors.slabShade;
  ctx.fillRect(-5, -17, 10, 5);
  ctx.restore();
  // The sign on its post, at the front: who it's for and how far along it is.
  const { post, w, h } = SITE;
  const foot = { x: (c.left.x + c.bottom.x) / 2, y: (c.left.y + c.bottom.y) / 2 + 4 };
  const lift = near ? Math.abs(Math.sin(time / 180)) * 6 : 0;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x - 3, foot.y - post, 6, post);
  const top = foot.y - post - h - lift;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x - w / 2 - 3, top - 3, w + 6, h + 6);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(foot.x - w / 2, top, w, h);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(foot.x - w / 2, top + h - 5, w, 5);
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = canvasFont('small', 'bold');
  ctx.fillText(`@${label.login}`, foot.x, top + 12, w - 10);
  ctx.font = canvasFont('small');
  ctx.fillText(label.stage, foot.x, top + 29, w - 10);
  ctx.textBaseline = 'alphabetic';
  const box = standing(plot, scaffold + 10);
  const left = Math.min(box.x, foot.x - w / 2 - 4);
  return {
    x: left,
    y: Math.min(box.y, top - 4),
    w: Math.max(box.x + box.w, foot.x + w / 2 + 4) - left,
    h: box.y + box.h - Math.min(box.y, top - 4),
  };
}

/** What a sleigh platform's sign says: where its sleigh goes, and who it belongs to. */
export interface PlatformLabel {
  name: string;
  by: string;
  /** Its sign's colour, from the level's theme. */
  color: string;
  closed: boolean;
}

/** The sleigh platform's sign: how tall its post is, and its board's size, in world pixels. */
export const PLATFORM_SIGN = { post: 70, w: 140, h: 40 };

/**
 * A sleigh platform: a low wooden deck with a sleigh waiting on it and a sign
 * on a post saying where it goes. At the sleigh station each one goes to a
 * participant's level; inside a level, one goes back to the North Pole. A
 * closed level's platform has a "Closed for repairs" sign and no sleigh.
 */
export function drawPlatform(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  label: PlatformLabel,
  time: number,
  near = false,
): Box {
  const c = corners(plot);
  const { x, y } = middle(plot);
  shadow(ctx, x, y + 6, 70);
  block(ctx, plot, 8, colors.gingerbread, colors.wood, colors.cocoa);
  if (!label.closed) {
    const sleigh = { kind: 'sleigh' as const, x: plot.x + 0.5, y: plot.y + 0.5, w: 1, h: 1 };
    ctx.save();
    ctx.translate(0, -8);
    drawSleigh(ctx, { ...sleigh, seed: 0, blocks: true });
    ctx.restore();
  }
  const { post, w, h } = PLATFORM_SIGN;
  const foot = { x: (c.left.x + c.bottom.x) / 2, y: (c.left.y + c.bottom.y) / 2 - 4 };
  const lift = near ? Math.abs(Math.sin(time / 180)) * 6 : 0;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x - 3, foot.y - post, 6, post);
  const top = foot.y - post - h - lift;
  ctx.fillRect(foot.x - w / 2 - 3, top - 3, w + 6, h + 6);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(foot.x - w / 2, top, w, h);
  ctx.fillStyle = label.closed ? colors.muted : label.color;
  ctx.fillRect(foot.x - w / 2, top + h - 5, w, 5);
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = canvasFont('small', 'bold');
  ctx.fillText(label.name, foot.x, top + 12, w - 10);
  ctx.font = canvasFont('small');
  ctx.fillText(label.closed ? 'Closed for repairs' : label.by, foot.x, top + 29, w - 10);
  ctx.textBaseline = 'alphabetic';
  const box = standing(plot, 50);
  const left = Math.min(box.x, foot.x - w / 2 - 4);
  return {
    x: left,
    y: Math.min(box.y, top - 4),
    w: Math.max(box.x + box.w, foot.x + w / 2 + 4) - left,
    h: box.y + box.h - Math.min(box.y, top - 4),
  };
}

/** A small "Being updated" sign on a post at a booth's side, while a change to it is being built. */
export function drawUpdateSign(ctx: CanvasRenderingContext2D, plot: Plot) {
  const c = corners(plot);
  const foot = { x: (c.bottom.x + c.right.x) / 2 + 10, y: (c.bottom.y + c.right.y) / 2 + 6 };
  const w = 104;
  const h = 22;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x - 2, foot.y - 30, 4, 30);
  const top = foot.y - 30 - h;
  ctx.fillRect(foot.x - w / 2 - 2, top - 2, w + 4, h + 4);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(foot.x - w / 2, top, w, h);
  ctx.fillStyle = colors.ink;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Being updated', foot.x, top + h / 2 + 1, w - 6);
  ctx.textBaseline = 'alphabetic';
}

/** How long a new booth's sparkles last, in milliseconds. */
export const SPARKLE_TIME = 2600;

/**
 * A short burst of gentle sparkles rising round a booth that just landed,
 * `age` milliseconds in. Each one fades in and out smoothly, so nothing flashes.
 */
export function drawSparkles(ctx: CanvasRenderingContext2D, plot: Plot, age: number) {
  if (age < 0 || age >= SPARKLE_TIME) return;
  const { x, y } = middle(plot);
  const along = age / SPARKLE_TIME;
  const fade = Math.sin(Math.PI * along);
  const tints = [colors.gold, colors.glow, colors.snow];
  ctx.save();
  for (let n = 0; n < 14; n++) {
    const seed = hash(plot.number, n, 9);
    const angle = seed * Math.PI * 2;
    const reach = 30 + 40 * hash(n, plot.number, 10);
    const at = {
      x: x + Math.cos(angle) * reach * (0.6 + 0.4 * along),
      y: y - 30 - along * (60 + 50 * seed) + Math.sin(angle) * reach * 0.3,
    };
    const r = 3 + 3 * hash(n, 11);
    ctx.globalAlpha = 0.75 * fade;
    ctx.fillStyle = tints[n % tints.length];
    ctx.beginPath();
    ctx.moveTo(at.x, at.y - r * 1.8);
    ctx.lineTo(at.x + r * 0.45, at.y);
    ctx.lineTo(at.x, at.y + r * 1.8);
    ctx.lineTo(at.x - r * 0.45, at.y);
    ctx.closePath();
    ctx.moveTo(at.x - r * 1.8, at.y);
    ctx.lineTo(at.x, at.y + r * 0.45);
    ctx.lineTo(at.x + r * 1.8, at.y);
    ctx.lineTo(at.x, at.y - r * 0.45);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws a plot and whatever stands on it. Returns where a click opens it.
 * `near` says the player stands at it, which makes an open plot's sign bounce.
 */
export function drawPlot(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  square: NorthPoleSquare | undefined,
  paint: PaintSquare,
  time: number,
  near = false,
  owner?: Owner,
): Box {
  if (plot.kind === 'open' || !square) return drawOpenPlot(ctx, plot, time, near);
  if (plot.kind === 'attraction') return drawAttraction(ctx, plot, square, paint, time);
  return drawStall(ctx, plot, square, paint, time, owner ?? { color: colors.gold, you: false });
}

/** A glow round a plot, for the one you are standing at or the one a link opened on. */
export function drawPlotGlow(ctx: CanvasRenderingContext2D, plot: Plot, strength: number) {
  const c = corners(plot);
  ctx.save();
  ctx.globalAlpha = 0.6 * strength;
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  diamond(ctx, c, 0);
  ctx.stroke();
  ctx.restore();
  const { x, y } = middle(plot);
  const tall =
    plot.kind === 'attraction'
      ? PAVILION.wall
      : plot.kind === 'booth'
        ? STALL.wall
        : CLAIM_SIGN.post;
  glow(ctx, x, y - tall / 2, tall, strength);
}

/**
 * A ring of string lights round a picked plot, on the snow, in steady warm
 * colours that never flash. `strength` fades it in and out.
 */
export function drawSelectionRing(ctx: CanvasRenderingContext2D, plot: Plot, strength: number) {
  if (strength <= 0) return;
  const c = corners(plot);
  const edges = [
    [c.top, c.right],
    [c.right, c.bottom],
    [c.bottom, c.left],
    [c.left, c.top],
  ] as const;
  ctx.save();
  ctx.globalAlpha = 0.5 * strength;
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 1.5;
  diamond(ctx, c, 0);
  ctx.stroke();
  ctx.restore();
  let n = 0;
  for (const [from, to] of edges)
    for (let k = 0; k < 8; k++) {
      const at = {
        x: from.x + ((to.x - from.x) * k) / 8,
        y: from.y + ((to.y - from.y) * k) / 8,
      };
      bulb(ctx, at.x, at.y, LIGHTS[n++ % LIGHTS.length], strength);
    }
  ctx.globalAlpha = 1;
}

/**
 * What marks a picked plot over everything in front of it: a soft beam of
 * light rising from it, seen even when something taller hides the stall, and
 * an arrow over `top`, the top of what stands on it, bouncing by `bounce`.
 */
export function drawSelectionBeam(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  top: number,
  strength: number,
  bounce: number,
) {
  if (strength <= 0) return;
  const c = corners(plot);
  const { x, y } = middle(plot);
  const height = y - top + 160;
  ctx.save();
  const beam = ctx.createLinearGradient(0, y, 0, y - height);
  beam.addColorStop(0, colors.glow);
  beam.addColorStop(1, `${colors.glow}00`);
  ctx.fillStyle = beam;
  ctx.globalAlpha = 0.3 * strength;
  ctx.beginPath();
  ctx.moveTo(c.left.x + 12, c.left.y);
  ctx.lineTo(c.bottom.x, c.bottom.y);
  ctx.lineTo(c.right.x - 12, c.right.y);
  ctx.lineTo(c.right.x - 26, y - height);
  ctx.lineTo(c.left.x + 26, y - height);
  ctx.closePath();
  ctx.fill();
  // The arrow, pointing down at the sign.
  const tip = top - 8 - bounce;
  ctx.globalAlpha = strength;
  ctx.fillStyle = colors.cocoa;
  quad(ctx, [
    { x: x - 15, y: tip - 25 },
    { x: x + 15, y: tip - 25 },
    { x, y: tip + 2 },
  ]);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  quad(ctx, [
    { x: x - 11, y: tip - 23 },
    { x: x + 11, y: tip - 23 },
    { x, y: tip - 2 },
  ]);
  ctx.fill();
  ctx.restore();
}

/** How a person looks: their coat and hat. */
export interface Look {
  coat: string;
  hat: string;
  scale: number;
}

/** An elf or a visitor, walking: their legs swing while `moving`. */
export function drawPerson(
  ctx: CanvasRenderingContext2D,
  at: Tile,
  look: Look,
  facing: number,
  moving: boolean,
  time: number,
) {
  const { x, y } = toScreen(at);
  const step = moving ? Math.sin(time / 90) : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(look.scale * (facing < 0 ? -1 : 1), look.scale);
  shadow(ctx, 0, 0, 9);
  ctx.fillStyle = colors.night;
  ctx.fillRect(-4 + step * 2, -10, 3, 10);
  ctx.fillRect(1 - step * 2, -10, 3, 10);
  ctx.fillStyle = look.coat;
  ctx.beginPath();
  ctx.moveTo(-7, -9);
  ctx.lineTo(7, -9);
  ctx.lineTo(4, -26);
  ctx.lineTo(-4, -26);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-6, -14, 12, 2);
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(0, -31, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.hat;
  ctx.beginPath();
  ctx.moveTo(-6, -34);
  ctx.lineTo(6, -34);
  ctx.lineTo(10, -46);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(-7, -36, 14, 3);
  ctx.beginPath();
  ctx.arc(10, -46, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A reindeer, grazing or wandering in its paddock. */
export function drawReindeer(
  ctx: CanvasRenderingContext2D,
  at: Tile,
  facing: number,
  red: boolean,
  time: number,
) {
  const { x, y } = toScreen(at);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing < 0 ? -1 : 1, 1);
  shadow(ctx, 0, 0, 16);
  const step = Math.sin(time / 200) * 2;
  ctx.fillStyle = colors.cocoa;
  for (const lx of [-10, -5, 6, 11]) ctx.fillRect(lx, -14, 3, 14 + (lx > 0 ? step : -step) / 2);
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.ellipse(0, -18, 15, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(9, -32, 6, 14);
  ctx.beginPath();
  ctx.ellipse(16, -33, 7, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(12, -37);
  ctx.lineTo(8, -48);
  ctx.lineTo(4, -50);
  ctx.moveTo(9, -45);
  ctx.lineTo(13, -50);
  ctx.moveTo(15, -37);
  ctx.lineTo(16, -49);
  ctx.lineTo(20, -52);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = red ? colors.berry : colors.night;
  ctx.beginPath();
  ctx.arc(23, -32, red ? 3 : 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.ellipse(-14, -20, 3, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Snow falling over the whole view, in screen pixels. */
export function drawSnowfall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  ctx.fillStyle = colors.snow;
  const flakes = Math.round((width * height) / 7000);
  for (let n = 0; n < flakes; n++) {
    const speed = 0.02 + 0.03 * hash(n, 20);
    const fall = (hash(n, 21) * height + time * speed) % (height + 20);
    const sway = Math.sin(time / 1500 + n) * 12;
    ctx.globalAlpha = 0.5 + 0.4 * hash(n, 22);
    ctx.beginPath();
    ctx.arc(hash(n, 23) * width + sway, fall - 10, 1 + 1.6 * hash(n, 24), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * The northern lights rippling across the top of the sky, in screen pixels:
 * bright against the night, and a faint glow, `strength` 0 to 1, over the snow.
 */
export function drawAurora(
  ctx: CanvasRenderingContext2D,
  width: number,
  time: number,
  strength = 1,
) {
  ctx.save();
  if (strength >= 1) ctx.globalCompositeOperation = 'lighter';
  for (const [n, color] of [colors.aurora, colors.violet, colors.mint].entries()) {
    ctx.globalAlpha = 0.12 * strength;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= width; x += 24) {
      const wave = Math.sin(x / (160 + n * 40) + time / (3000 + n * 900) + n * 2);
      ctx.lineTo(x, 90 + n * 22 + wave * 30);
    }
    ctx.lineTo(width, 0);
    ctx.fill();
  }
  ctx.restore();
}

/** The big ferris wheel: a turning wheel of lit gondolas on an A-frame, rising over the town. */
function drawWheel(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = middle(thing);
  shadow(ctx, x, y + 6, 70);
  block(ctx, thing, 8, colors.snowShade, colors.surface, colors.night);
  const radius = 108;
  const hub = { x, y: y - 8 - radius - 34 };
  const depth = { x: 14, y: -7 };
  const turn = time / 9000;
  const spokes = 12;
  const rim = (offset: Tile, color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(hub.x + offset.x, hub.y + offset.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let n = 0; n < spokes; n++) {
      const a = turn + (n / spokes) * Math.PI * 2;
      ctx.moveTo(hub.x + offset.x, hub.y + offset.y);
      ctx.lineTo(hub.x + offset.x + Math.cos(a) * radius, hub.y + offset.y + Math.sin(a) * radius);
    }
    ctx.lineWidth = width / 2;
    ctx.stroke();
  };
  // The far legs and rim, then the axle across, then the near ones.
  const legs = (offset: Tile, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hub.x + offset.x - 52, y + offset.y);
    ctx.lineTo(hub.x + offset.x, hub.y + offset.y);
    ctx.lineTo(hub.x + offset.x + 52, y + offset.y);
    ctx.stroke();
  };
  legs(depth, colors.night);
  rim(depth, colors.mountain, 4);
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(hub.x, hub.y);
  ctx.lineTo(hub.x + depth.x, hub.y + depth.y);
  ctx.stroke();
  rim({ x: 0, y: 0 }, colors.snow, 5);
  legs({ x: 0, y: 0 }, colors.surface);
  ctx.lineWidth = 1;
  // The gondolas hang level as the wheel turns, and lights twinkle round the rim.
  const cars = [colors.berry, colors.gold, colors.pine, colors.violet];
  for (let n = 0; n < spokes; n++) {
    const a = turn + (n / spokes) * Math.PI * 2;
    const gx = hub.x + depth.x / 2 + Math.cos(a) * radius;
    const gy = hub.y + depth.y / 2 + Math.sin(a) * radius;
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(gx - 1, gy, 2, 8);
    ctx.fillStyle = cars[n % cars.length];
    ctx.beginPath();
    ctx.moveTo(gx - 11, gy + 8);
    ctx.lineTo(gx + 11, gy + 8);
    ctx.lineTo(gx + 8, gy + 22);
    ctx.lineTo(gx - 8, gy + 22);
    ctx.fill();
    ctx.fillStyle = colors.snow;
    ctx.fillRect(gx - 12, gy + 6, 24, 3);
    bulb(
      ctx,
      hub.x + Math.cos(a + 0.26) * radius,
      hub.y + Math.sin(a + 0.26) * radius,
      colors.lantern,
      twinkle(time, n),
    );
  }
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, 9, 0, Math.PI * 2);
  ctx.fill();
}

/** A domed tent in candy-cane stripes, its doorway dark and a pennant on top. */
function drawTent(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = middle(thing);
  const rx = 52;
  const ry = 26;
  const wall = 26;
  const dome = 58;
  shadow(ctx, x, y + 6, 58);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI);
  ctx.lineTo(x - rx, y - wall);
  ctx.ellipse(x, y - wall, rx, dome, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - rx, y - wall - dome, 2 * rx, wall + dome + ry);
  ctx.fillStyle = thing.seed > 0.5 ? colors.berry : colors.violet;
  for (let n = -6; n < 6; n++) {
    ctx.beginPath();
    ctx.moveTo(x + n * 18, y + ry);
    ctx.lineTo(x + n * 18 + 9, y + ry);
    ctx.lineTo(x + n * 18 + 9 + 60, y - wall - dome);
    ctx.lineTo(x + n * 18 + 60, y - wall - dome);
    ctx.fill();
  }
  // The dome's shaded side, and its lit one.
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.2;
  ctx.fillRect(x + rx * 0.25, y - wall - dome, rx, wall + dome + ry);
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.15;
  ctx.fillRect(x - rx, y - wall - dome, rx * 0.5, wall + dome + ry);
  ctx.globalAlpha = 1;
  ctx.restore();
  // The doorway, with warm light inside.
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.moveTo(x - 12, y + ry);
  ctx.lineTo(x - 12, y + ry - 18);
  ctx.quadraticCurveTo(x, y + ry - 40, x + 12, y + ry - 18);
  ctx.lineTo(x + 12, y + ry);
  ctx.fill();
  glow(ctx, x, y + ry - 10, 22, 0.8);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - rx, y - wall - 2, 2 * rx, 3);
  const top = y - wall - dome;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 1, top - 18, 2, 18);
  ctx.fillStyle = colors.gold;
  quad(ctx, [
    { x: x + 1, y: top - 18 },
    { x: x + 15, y: top - 14 + Math.sin(time / 380 + thing.seed * 9) * 2 },
    { x: x + 1, y: top - 10 },
  ]);
  ctx.fill();
}

/** A park bench, snow on its seat. */
function drawBench(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 16);
  const seat = { x: thing.x + 0.15, y: thing.y + 0.35, w: 0.7, h: 0.3 };
  ctx.fillStyle = colors.night;
  ctx.fillRect(x - 12, y - 8, 2, 8);
  ctx.fillRect(x + 10, y - 8, 2, 8);
  block(ctx, { ...seat, y: seat.y - 0.12, h: 0.08 }, 12, colors.snow, colors.wood, colors.cocoa, 8);
  block(ctx, seat, 3, colors.snow, colors.wood, colors.cocoa, 8);
}

/** A cocoa cart on wheels, under a striped canopy, its lantern lit. */
function drawCart(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 22);
  const body = { x: thing.x + 0.1, y: thing.y + 0.25, w: 0.8, h: 0.5 };
  block(ctx, body, 20, colors.gingerbread, colors.berry, colors.cocoa, 6);
  ctx.fillStyle = colors.night;
  for (const dx of [-12, 10]) {
    ctx.beginPath();
    ctx.arc(x + dx, y + 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 16, y - 46, 2, 22);
  ctx.fillRect(x + 14, y - 46, 2, 22);
  for (let n = 0; n < 4; n++) {
    ctx.fillStyle = n % 2 ? colors.snow : colors.pine;
    ctx.fillRect(x - 20 + n * 10, y - 52, 10, 8);
  }
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 21, y - 54, 42, 3);
  glow(ctx, x + 12, y - 38, 20, 0.7 + 0.3 * Math.sin(time / 700 + thing.seed * 10));
  ctx.fillStyle = colors.lantern;
  ctx.fillRect(x + 9, y - 42, 6, 7);
}

/** Pillars striped like candy canes, `height` tall on a small footprint. */
function candyPillar(ctx: CanvasRenderingContext2D, box: Box, height: number) {
  block(ctx, box, height, colors.snow, colors.snow, colors.snowShade);
  for (let h = 6; h < height; h += 16)
    block(ctx, box, 6, colors.berry, colors.berry, colors.cocoa, h);
}

/** The entrance arch over the main path at the front of the island, "North Pole Carnival" across it. */
function drawArch(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const tall = 112;
  const beam = 34;
  const near = { x: thing.x + 0.3, y: thing.y + thing.h - 0.4, w: 0.4, h: 0.4 };
  const far = { x: thing.x + 0.3, y: thing.y, w: 0.4, h: 0.4 };
  candyPillar(ctx, far, tall);
  candyPillar(ctx, near, tall);
  const top = { x: thing.x + 0.3, y: thing.y, w: 0.4, h: thing.h - 0.4 + 0.4 };
  block(ctx, top, beam, colors.snow, colors.cocoa, colors.berry, tall);
  const c = corners(top);
  const face: Face = { a: c.bottom, b: c.right, out: { x: TILE_W / 2, y: TILE_H / 2 } };
  ctx.fillStyle = colors.cream;
  band(ctx, face, 0.06, 0.94, tall + 5, tall + beam - 5);
  ctx.fill();
  const width = Math.abs(face.b.x - face.a.x);
  faceText(
    ctx,
    face,
    'North Pole Carnival',
    0.5,
    tall + beam / 2,
    width * 0.82,
    canvasFont('body', 'bold'),
    colors.berry,
  );
  for (let n = 0; n <= 10; n++) {
    const at = onFace(face, n / 10, tall + beam + 2);
    bulb(ctx, at.x, at.y, n % 2 ? colors.lantern : colors.berry, twinkle(time, n));
  }
  ctx.fillStyle = colors.gold;
  const star = onFace(face, 0.5, tall + beam + 16);
  ctx.beginPath();
  for (let n = 0; n < 10; n++) {
    const r = n % 2 ? 4 : 10;
    const a = (n / 10) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(star.x + Math.cos(a) * r, star.y + Math.sin(a) * r);
  }
  ctx.fill();
}

/** The big banner by the town square, strung between two poles. */
function drawBanner(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const c = corners(thing);
  const face: Face = { a: c.left, b: c.bottom, out: { x: -TILE_W / 2, y: TILE_H / 2 } };
  const tall = 104;
  ctx.fillStyle = colors.cocoa;
  for (const along of [0.04, 0.96]) {
    const foot = onFace(face, along, 0, -0.5);
    ctx.fillRect(foot.x - 2, foot.y - tall - 8, 4, tall + 8);
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.arc(foot.x, foot.y - tall - 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.cocoa;
  }
  const ripple = Math.sin(time / 800) * 2;
  ctx.fillStyle = colors.berry;
  band(ctx, face, 0.06, 0.94, tall - 44 + ripple, tall, -0.5);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  band(ctx, face, 0.06, 0.94, tall - 4, tall, -0.5);
  ctx.fill();
  const width = Math.abs(face.b.x - face.a.x);
  faceText(
    ctx,
    face,
    "Season's Greetings",
    0.5,
    tall - 22,
    width * 0.8,
    canvasFont('body', 'bold'),
    colors.cream,
    -0.5,
  );
}

/** Bunting strung between two poles over the main path, its flags fluttering. */
function drawBunting(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const a = toScreen({ x: thing.x, y: thing.y });
  const b = toScreen({ x: thing.x, y: thing.y + thing.h - 1 });
  const tall = 78;
  ctx.fillStyle = colors.cocoa;
  for (const p of [a, b]) ctx.fillRect(p.x - 2, p.y - tall, 4, tall);
  const flags = [colors.berry, colors.gold, colors.pine, colors.snow, colors.violet];
  const at = (t: number) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t - tall + Math.sin(t * Math.PI) * 18,
  });
  ctx.strokeStyle = colors.ink;
  ctx.beginPath();
  for (let n = 0; n <= 12; n++) {
    const p = at(n / 12);
    if (n) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  }
  ctx.stroke();
  for (let n = 0; n < 11; n++) {
    const p = at((n + 0.5) / 11);
    const q = at((n + 1.2) / 11);
    const flutter = Math.sin(time / 300 + n + thing.seed * 9) * 2;
    ctx.fillStyle = flags[n % flags.length];
    quad(ctx, [p, { x: (p.x + q.x) / 2 + flutter, y: (p.y + q.y) / 2 + 13 }, q]);
    ctx.fill();
  }
}

/** The dusk sky, drawn once to its own layer: deep blue overhead, warm at the horizon. In screen pixels. */
export function drawSky(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, colors.night);
  sky.addColorStop(0.35, colors.dusk);
  sky.addColorStop(0.62, colors.duskLow);
  sky.addColorStop(0.78, colors.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
}

/** The mountains and hills on the horizon, drawn once to their own layer. In screen pixels. */
export function drawMountains(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const ridge = (
    base: number,
    peak: number,
    step: number,
    seed: number,
    color: string,
    caps: boolean,
  ) => {
    const points: Tile[] = [];
    for (let x = -step, n = 0; x <= width + step; x += step, n++)
      points.push({ x, y: base - peak * (0.35 + 0.65 * hash(n, seed)) });
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.lineTo(width, height);
    ctx.fill();
    if (!caps) return;
    ctx.fillStyle = colors.snow;
    ctx.globalAlpha = 0.85;
    for (let n = 1; n < points.length - 1; n++) {
      const p = points[n];
      if (p.y > points[n - 1].y || p.y > points[n + 1].y) continue;
      const left = points[n - 1];
      const right = points[n + 1];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + (left.x - p.x) * 0.3, p.y + (left.y - p.y) * 0.3);
      ctx.lineTo(p.x - step * 0.05, p.y + (left.y - p.y) * 0.18);
      ctx.lineTo(p.x + (right.x - p.x) * 0.3, p.y + (right.y - p.y) * 0.3);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  ridge(height * 0.62, height * 0.3, Math.max(80, width / 9), 31, colors.mountainFar, true);
  ridge(height * 0.7, height * 0.22, Math.max(60, width / 13), 32, colors.mountain, true);
  // Rolling snowy hills, nearer.
  ctx.fillStyle = colors.hill;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 20; x += 20)
    ctx.lineTo(x, height * 0.78 + Math.sin(x / 140) * 16 + Math.sin(x / 57 + 1) * 6);
  ctx.lineTo(width, height);
  ctx.fill();
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 20; x += 20)
    ctx.lineTo(x, height * 0.86 + Math.sin(x / 190 + 2) * 14);
  ctx.lineTo(width, height);
  ctx.fill();
}

/** Clouds drifting slowly across the sky, in screen pixels. */
export function drawClouds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  ctx.fillStyle = colors.cloud;
  for (let n = 0; n < 6; n++) {
    const speed = 0.004 + 0.004 * hash(n, 40);
    const span = width + 320;
    const x = ((hash(n, 41) * span + time * speed) % span) - 160;
    const y = height * (0.12 + 0.3 * hash(n, 42));
    const size = 30 + 30 * hash(n, 43);
    ctx.globalAlpha = 0.28 + 0.2 * hash(n, 44);
    ctx.beginPath();
    ctx.ellipse(x, y, size * 2.2, size * 0.5, 0, 0, Math.PI * 2);
    ctx.ellipse(x - size * 0.6, y - size * 0.3, size * 0.9, size * 0.55, 0, 0, Math.PI * 2);
    ctx.ellipse(x + size * 0.5, y - size * 0.4, size, size * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** The island's outline: its four ground corners on screen. */
export interface Island {
  top: Tile;
  right: Tile;
  bottom: Tile;
  left: Tile;
}

/**
 * The island, drawn once to its own layer: the snow slab's thickness under its
 * front edges, its shadow, the ground, the dusk over it and the fence round
 * its back. `slab` is how thick it is.
 */
export function drawIsland(
  ctx: CanvasRenderingContext2D,
  world: World,
  island: Island,
  slab: number,
) {
  const { top, right, bottom, left } = island;
  // Its shadow on the hills below, then its two front faces.
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.ellipse(bottom.x, bottom.y + slab + 20, (right.x - left.x) * 0.42, slab, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  const face = (a: Tile, b: Tile, color: string) => {
    ctx.fillStyle = color;
    quad(ctx, [a, b, { x: b.x, y: b.y + slab }, { x: a.x, y: a.y + slab }]);
    ctx.fill();
    // Layers in the snow, and icicles hanging from its foot.
    ctx.strokeStyle = colors.snowShade;
    ctx.globalAlpha = 0.6;
    for (const depth of [0.35, 0.65]) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + slab * depth);
      ctx.lineTo(b.x, b.y + slab * depth);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.ice;
    const steps = Math.ceil(Math.abs(b.x - a.x) / 18);
    for (let n = 0; n < steps; n++) {
      const t = (n + 0.5) / steps;
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t + slab };
      const long = 6 + 12 * hash(n, p.x, 50);
      quad(ctx, [
        { x: p.x - 4, y: p.y },
        { x: p.x + 4, y: p.y },
        { x: p.x, y: p.y + long },
      ]);
      ctx.fill();
    }
  };
  face(left, bottom, colors.slab);
  face(bottom, right, colors.slabShade);
  ctx.fillStyle = colors.snow;
  quad(ctx, [
    left,
    bottom,
    right,
    { x: right.x, y: right.y + 6 },
    { x: bottom.x, y: bottom.y + 6 },
    { x: left.x, y: left.y + 6 },
  ]);
  ctx.fill();
  drawGround(ctx, world, {
    minX: -world.extent,
    maxX: world.extent,
    minY: -world.extent,
    maxY: world.extent,
  });
  // Dusk settles over the snow, so the lights stand out on it.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = colors.dusk;
  ctx.fillRect(left.x - 10, top.y - 10, right.x - left.x + 20, bottom.y - top.y + slab + 40);
  ctx.restore();
  drawEdgeFence(ctx, top, right);
  drawEdgeFence(ctx, left, top);
}

/** The fence along the island's front edges, drawn once to a layer over everything else. */
export function drawFrontFence(ctx: CanvasRenderingContext2D, island: Island) {
  drawEdgeFence(ctx, island.left, island.bottom);
  drawEdgeFence(ctx, island.bottom, island.right);
}

/** How high the fence's top rail is, where the string lights hang. */
const FENCE = 20;

/** A fence along one edge of the island, from `a` to `b`. */
function drawEdgeFence(ctx: CanvasRenderingContext2D, a: Tile, b: Tile) {
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 3;
  for (const h of [FENCE - 4, 8]) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - h);
    ctx.lineTo(b.x, b.y - h);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  for (const p of alongEdge(a, b, 24)) {
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(p.x - 2, p.y - FENCE, 4, FENCE);
    ctx.fillStyle = colors.snow;
    ctx.fillRect(p.x - 2.5, p.y - FENCE - 2, 5, 3);
  }
}

const LIGHTS = [colors.lantern, colors.berry, colors.gold, colors.mint];

/** String lights along the fence, glowing and gently twinkling: on its back edges or its front ones. */
export function drawStringLights(
  ctx: CanvasRenderingContext2D,
  island: Island,
  front: boolean,
  time: number,
) {
  const edges = front
    ? [
        [island.left, island.bottom],
        [island.bottom, island.right],
      ]
    : [
        [island.left, island.top],
        [island.top, island.right],
      ];
  let n = 0;
  for (const [a, b] of edges)
    for (const p of alongEdge(a, b, 22)) {
      const sag = 3 * Math.sin((n % 2) * Math.PI);
      bulb(ctx, p.x, p.y - FENCE + 4 + sag, LIGHTS[n % LIGHTS.length], twinkle(time, n));
      n++;
    }
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
    if (thing.kind === 'lamp' || thing.kind === 'cart') {
      const { x, y } = toScreen(thing);
      pool(x, y, 58, 0.85 + 0.15 * Math.sin(time / 900 + thing.seed * 20));
    } else if (thing.kind === 'cabin' || thing.kind === 'tent') {
      const { x, y } = middle(thing);
      pool(x, y + 26, 70, 0.8);
    }
  }
  for (const plot of world.plots) {
    if (plot.kind === 'open') continue;
    const face = faceOf(plot);
    const at = onFace(face, 0.5, 0, 0.6);
    pool(at.x, at.y, plot.kind === 'attraction' ? 110 : 76, 1);
  }
  ctx.globalAlpha = 1;
}

/** The stream's ripples, drawn live over the island's layer. */
export function drawRipples(ctx: CanvasRenderingContext2D, world: World, time: number) {
  ctx.strokeStyle = colors.snow;
  ctx.globalAlpha = 0.7;
  for (const [at, ground] of world.ground) {
    if (ground !== 'water') continue;
    const [x, y] = at.split(',').map(Number);
    const { x: sx, y: sy } = toScreen({ x, y });
    const ripple = ((time / 40 + y * 13) % 24) - 12;
    ctx.beginPath();
    ctx.moveTo(sx - 10 + ripple / 2, sy + ripple / 4);
    ctx.lineTo(sx + ripple / 2, sy + ripple / 4 + 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
