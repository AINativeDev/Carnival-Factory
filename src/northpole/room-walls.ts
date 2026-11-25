/**
 * Dresses a square's room so its inside matches its outside: log walls for a
 * cabin, striped fabric for a tent, planks for a shed, a kiosk or the usual
 * stall, trimmed in the roof colour the owner chose. And a window in the lit
 * wall shows the dusk outside with snow falling, so the room feels like part of
 * the North Pole rather than a box in the dark.
 */
import type { Room } from './interior';
import type { StallStyle } from './square';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

export interface WallStyle {
  material: 'logs' | 'stripes' | 'planks';
  /** The roof colour, for the trim and a tent's stripes. */
  trim: string;
  /** A second colour: a tent's other stripe, and a highlight. */
  accent: string;
}

/** How a square's room looks inside, from its stall. */
export function wallStyle(stall: StallStyle | undefined): WallStyle {
  const material =
    stall?.shape === 'cabin' ? 'logs' : stall?.shape === 'tent' ? 'stripes' : 'planks';
  return {
    material,
    trim: colors[stall?.roof ?? 'berry'],
    accent: colors[stall?.trim ?? 'cream'],
  };
}

/** A point on a side wall: `u` from its front edge (0) to the back wall (1), `v` from its top (0) to the floor (1). */
export function sideWallPoint(room: Room, side: 'left' | 'right', u: number, v: number): Tile {
  const sign = side === 'left' ? -1 : 1;
  const front = room.centre + sign * room.frontHalf;
  const back = room.centre + sign * room.backHalf;
  const rise = room.width * 0.06;
  const x = front + (back - front) * u;
  const top = room.top - rise + rise * u;
  const bottom = room.front + (room.back - room.front) * u;
  return { x, y: top + (bottom - top) * v };
}

/** Fills the patch of a side wall between depths u0..u1 and heights v0..v1. */
function patch(
  ctx: CanvasRenderingContext2D,
  room: Room,
  side: 'left' | 'right',
  u0: number,
  u1: number,
  v0: number,
  v1: number,
) {
  const corners = [
    sideWallPoint(room, side, u0, v0),
    sideWallPoint(room, side, u1, v0),
    sideWallPoint(room, side, u1, v1),
    sideWallPoint(room, side, u0, v1),
  ];
  ctx.beginPath();
  corners.forEach(({ x, y }, n) => {
    if (n === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

/** The side walls' material, a trim band along their top in the roof colour, and a skirting board. */
export function drawSideWalls(ctx: CanvasRenderingContext2D, room: Room, style: WallStyle) {
  for (const side of ['left', 'right'] as const) {
    ctx.save();
    if (style.material === 'logs') {
      for (let n = 0; n < 8; n++) {
        const v = 0.06 + n * 0.115;
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = colors.cocoa;
        patch(ctx, room, side, 0, 1, v + 0.095, v + 0.115);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = colors.snowLit;
        patch(ctx, room, side, 0, 1, v, v + 0.025);
      }
    } else if (style.material === 'stripes') {
      for (let n = 0; n < 10; n++) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = n % 2 === 0 ? style.trim : style.accent;
        patch(ctx, room, side, n / 10, (n + 1) / 10, 0.06, 0.94);
      }
    } else {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = colors.cocoa;
      for (let n = 1; n < 9; n++) patch(ctx, room, side, n / 9 - 0.004, n / 9 + 0.004, 0.06, 0.94);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = style.trim;
    patch(ctx, room, side, 0, 1, 0, 0.06);
    ctx.fillStyle = colors.cocoa;
    patch(ctx, room, side, 0, 1, 0.94, 1);
    ctx.restore();
  }
}

/** Snowflakes falling at `time`: where each is, from 0 to 1 across and down, and its size. */
export function flakes(count: number, time: number) {
  return Array.from({ length: count }, (_, n) => {
    const x = (n * 0.618034 + Math.sin(time * 0.7 + n) * 0.03 + 1) % 1;
    const y = (n * 0.37 + time * (0.06 + (n % 5) * 0.012)) % 1;
    return { x: Math.min(1, Math.max(0, x)), y, size: 0.6 + (n % 3) * 0.4 };
  });
}

/** A window in the lit left wall: the dusk sky, the mountains, a few lights far off, and snow falling past. */
export function drawWindow(ctx: CanvasRenderingContext2D, room: Room, time: number) {
  const [u0, u1, v0, v1] = [0.3, 0.64, 0.2, 0.56];
  const corner = (u: number, v: number) => sideWallPoint(room, 'left', u, v);
  const pane = [corner(u0, v0), corner(u1, v0), corner(u1, v1), corner(u0, v1)];
  const outline = () => {
    ctx.beginPath();
    pane.forEach(({ x, y }, n) => {
      if (n === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  };
  const left = Math.min(...pane.map((p) => p.x));
  const right = Math.max(...pane.map((p) => p.x));
  const top = Math.min(...pane.map((p) => p.y));
  const bottom = Math.max(...pane.map((p) => p.y));
  const [w, h] = [right - left, bottom - top];
  ctx.save();
  outline();
  ctx.clip();
  const sky = ctx.createLinearGradient(0, top, 0, bottom);
  sky.addColorStop(0, colors.dusk);
  sky.addColorStop(0.7, colors.duskLow);
  sky.addColorStop(1, colors.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(left, top, w, h);
  ctx.fillStyle = colors.mountainFar;
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  for (let n = 0; n <= 6; n++)
    ctx.lineTo(left + (w * n) / 6, bottom - h * (0.25 + 0.18 * Math.abs(Math.sin(n * 1.7))));
  ctx.lineTo(right, bottom);
  ctx.fill();
  ctx.fillStyle = colors.lantern;
  for (let n = 0; n < 4; n++) {
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 2 + n * 1.9);
    ctx.fillRect(left + w * (0.15 + n * 0.22), bottom - h * 0.1, w * 0.02, h * 0.03);
  }
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = colors.snow;
  for (const flake of flakes(14, time)) {
    ctx.beginPath();
    ctx.arc(
      left + flake.x * w,
      top + flake.y * h,
      Math.max(1, (w / 90) * flake.size),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = Math.max(2, room.width / 160);
  outline();
  ctx.stroke();
  ctx.lineWidth = Math.max(1, room.width / 320);
  const mid = (a: Tile, b: Tile) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const [a, b, c, d] = pane as [Tile, Tile, Tile, Tile];
  for (const [from, to] of [
    [mid(a, b), mid(d, c)],
    [mid(a, d), mid(b, c)],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
}
