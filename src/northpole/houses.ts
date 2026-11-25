/**
 * The houses round the town: log cabins with lit windows and smoking chimneys,
 * and the reindeer's red stable, each under a pitched roof with snow on it.
 */
import { block, corners, glow, middle, shadow } from './brushes';
import { canvasFont, theme } from './theme';
import type { Box, Thing, Tile } from './world';

const { colors } = theme;

/** A roof slope's four corners on screen: two along its eave, then the ridge's two ends. */
type Slope = [Tile, Tile, Tile, Tile];

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
  const slopes: [Slope, Slope] = along
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
    face.forEach((p, i) => {
      if (i) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
    });
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
  gable.forEach((p, i) => {
    if (i) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  });
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
export function drawCabin(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
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
export function drawStable(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
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
