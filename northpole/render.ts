/**
 * Drawing the isometric North Pole: the ground, the things standing on it, the
 * stalls and attractions with their squares' drawings on their front panels,
 * and the people walking about. Everything is drawn in world pixels, with the
 * town square's centre at (0, 0), and the map moves the camera.
 */
import type { NorthPoleSquare } from './square';
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

/** The side of a booth's front panel, and of an attraction's, in world pixels. */
export const BOOTH_PANEL = 84;
export const ATTRACTION_PANEL = 124;

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
) {
  const c = corners(box);
  ctx.fillStyle = left;
  ctx.beginPath();
  ctx.moveTo(c.left.x, c.left.y);
  ctx.lineTo(c.bottom.x, c.bottom.y);
  ctx.lineTo(c.bottom.x, c.bottom.y - height);
  ctx.lineTo(c.left.x, c.left.y - height);
  ctx.fill();
  ctx.fillStyle = right;
  ctx.beginPath();
  ctx.moveTo(c.bottom.x, c.bottom.y);
  ctx.lineTo(c.right.x, c.right.y);
  ctx.lineTo(c.right.x, c.right.y - height);
  ctx.lineTo(c.bottom.x, c.bottom.y - height);
  ctx.fill();
  ctx.fillStyle = top;
  diamond(ctx, c, height);
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

/** The ground: snow, the cleared paths, the town square, the ice and the stream. */
export function drawGround(
  ctx: CanvasRenderingContext2D,
  world: World,
  range: TileRange,
  time: number,
) {
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
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = colors.snow;
        const ripple = ((time / 40 + y * 13) % 24) - 12;
        ctx.beginPath();
        ctx.moveTo(sx - 10 + ripple / 2, sy + ripple / 4);
        ctx.lineTo(sx + ripple / 2, sy + ripple / 4 + 2);
        ctx.stroke();
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

function drawTree(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 16);
  drawPine(ctx, x + (thing.seed - 0.5) * 10, y + 2, 0.8 + 0.45 * thing.seed);
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
  }
}

/** A sign on a board: a name, and whose it is under it. */
function sign(ctx: CanvasRenderingContext2D, x: number, y: number, name: string, by: string) {
  ctx.font = canvasFont('small', 'bold');
  const width = Math.min(190, Math.max(ctx.measureText(name).width, by.length * 7) + 16);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - width / 2, y, width, 38);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - width / 2 + 2, y + 2, width - 4, 34);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - width / 2 - 1, y - 2, width + 2, 3);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = colors.text;
  ctx.fillText(name, x, y + 4, width - 8);
  ctx.font = canvasFont('small');
  ctx.fillStyle = colors.glow;
  ctx.fillText(by, x, y + 20, width - 8);
  ctx.textBaseline = 'alphabetic';
}

/** Where a plot's front panel is, in world pixels: its top-left corner and size. */
export function panelBox(plot: Plot): Box {
  const { x, y } = middle(plot);
  const size = plot.kind === 'attraction' ? ATTRACTION_PANEL : BOOTH_PANEL;
  const lift = plot.kind === 'attraction' ? 56 : 30;
  return { x: x - size / 2, y: y - lift - size, w: size, h: size };
}

/** What draws a square onto a panel: the map's own `drawSquare`. */
export type PaintSquare = (square: NorthPoleSquare, x: number, y: number, size: number) => void;

/** A participant's market stall: a counter, a striped awning and its square on the front panel. */
function drawStall(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  square: NorthPoleSquare,
  paint: PaintSquare,
) {
  const { x, y } = middle(plot);
  const panel = panelBox(plot);
  shadow(ctx, x, y + 6, 44);
  // The posts behind the panel and the counter in front of it.
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(panel.x - 6, panel.y - 10, 5, panel.h + 40);
  ctx.fillRect(panel.x + panel.w + 1, panel.y - 10, 5, panel.h + 40);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(panel.x - 6, panel.y - 6, panel.w + 12, panel.h + 12);
  paint(square, panel.x, panel.y, panel.w);
  // The awning, striped, with snow on top.
  const top = panel.y - 10;
  for (let n = 0; n < 6; n++) {
    ctx.fillStyle = n % 2 ? colors.snow : colors.berry;
    const w = (panel.w + 20) / 6;
    ctx.beginPath();
    ctx.moveTo(panel.x - 10 + n * w, top);
    ctx.lineTo(panel.x - 10 + (n + 1) * w, top);
    ctx.lineTo(panel.x - 10 + (n + 1) * w, top - 12);
    ctx.lineTo(panel.x - 10 + n * w, top - 12);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(panel.x - 10 + (n + 0.5) * w, top, w / 2, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = colors.snow;
  ctx.fillRect(panel.x - 12, top - 15, panel.w + 24, 4);
  block(
    ctx,
    { x: plot.x, y: plot.y + plot.h - 1, w: plot.w, h: 1 },
    16,
    colors.gingerbread,
    colors.wood,
    colors.cocoa,
  );
  sign(ctx, x, y + 2, square.name, `@${square.id}`);
}

/** One of the North Pole's attractions: a raised stage, bunting, and its square on a big panel. */
function drawAttraction(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  square: NorthPoleSquare,
  paint: PaintSquare,
  time: number,
) {
  const { x, y } = middle(plot);
  const panel = panelBox(plot);
  shadow(ctx, x, y + 8, 76);
  block(ctx, plot, 12, colors.snowShade, colors.surface, colors.night);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(panel.x - 8, panel.y - 8, 6, panel.h + 70);
  ctx.fillRect(panel.x + panel.w + 2, panel.y - 8, 6, panel.h + 70);
  ctx.fillStyle = colors.surface;
  ctx.fillRect(panel.x - 6, panel.y - 6, panel.w + 12, panel.h + 12);
  paint(square, panel.x, panel.y, panel.w);
  // Bunting along the top, and lights twinkling along it.
  for (let n = 0; n < 8; n++) {
    const bx = panel.x - 6 + ((panel.w + 12) * (n + 0.5)) / 8;
    ctx.fillStyle = [colors.berry, colors.gold, colors.pine, colors.violet][n % 4];
    ctx.beginPath();
    ctx.moveTo(bx - 7, panel.y - 12);
    ctx.lineTo(bx + 7, panel.y - 12);
    ctx.lineTo(bx, panel.y - 2);
    ctx.fill();
    ctx.globalAlpha = Math.sin(time / 250 + n * 2) > 0 ? 1 : 0.4;
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.arc(bx, panel.y - 14, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = colors.gold;
  ctx.fillRect(panel.x - 10, panel.y - 18, panel.w + 20, 4);
  sign(ctx, x, y + 6, square.name, 'North Pole');
}

/** An open plot: a staked-out square of fresh snow, and a "For claim" sign. */
function drawOpenPlot(ctx: CanvasRenderingContext2D, plot: Plot, time: number) {
  const c = corners(plot);
  ctx.save();
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  diamond(ctx, c, 0);
  ctx.stroke();
  ctx.restore();
  for (const p of [c.top, c.right, c.bottom, c.left]) {
    ctx.fillStyle = colors.wood;
    ctx.fillRect(p.x - 1.5, p.y - 12, 3, 12);
    ctx.fillStyle = colors.berry;
    ctx.fillRect(p.x - 1.5, p.y - 12, 3, 3);
  }
  const { x, y } = middle(plot);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 2, y - 44, 4, 44);
  const sway = Math.sin(time / 900 + plot.number) * 1.5;
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 40, y - 66 + sway, 80, 26);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 41, y - 68 + sway, 82, 3);
  ctx.fillStyle = colors.night;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('For claim', x, y - 52 + sway, 76);
  ctx.textBaseline = 'alphabetic';
}

/** Draws a plot and whatever stands on it. */
export function drawPlot(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  square: NorthPoleSquare | undefined,
  paint: PaintSquare,
  time: number,
) {
  if (plot.kind === 'open' || !square) drawOpenPlot(ctx, plot, time);
  else if (plot.kind === 'attraction') drawAttraction(ctx, plot, square, paint, time);
  else drawStall(ctx, plot, square, paint);
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
  const panel = panelBox(plot);
  glow(ctx, panel.x + panel.w / 2, panel.y + panel.h / 2, panel.w, strength);
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
  ctx.fillStyle = colors.wood;
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
