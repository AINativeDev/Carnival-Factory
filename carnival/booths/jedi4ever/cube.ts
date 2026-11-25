import { theme } from '../../../src/northpole/theme';
import type { Ctx } from './brushes';

type Pt = [number, number];
type Vec = [number, number, number];

/** A point on the edge of a unit square, walked round it from 0 to 4. */
function edgePoint(t: number): Pt {
  const s = ((t % 4) + 4) % 4;
  if (s < 1) return [s, 0];
  if (s < 2) return [1, s - 1];
  if (s < 3) return [3 - s, 1];
  return [0, 4 - s];
}

/** The top's three blocks: rays from the middle to the edge meet in a pinwheel. */
const RAYS = [0.35, 1.65, 2.75];

function pinwheel(): Pt[][] {
  return RAYS.map((from, i) => {
    const to = RAYS[i + 1] ?? (RAYS[0] ?? 0) + 4;
    const rim: Pt[] = [edgePoint(from)];
    for (let corner = Math.ceil(from + 1e-6); corner < to; corner++) rim.push(edgePoint(corner));
    rim.push(edgePoint(to));
    return [[0.5, 0.5], ...rim];
  });
}

/** A side's blocks: two pieces that lock together at a notch. */
const SIDE: Pt[][] = [
  [
    [0, 0],
    [0.5, 0],
    [0.5, 0.45],
    [0.72, 0.45],
    [0.72, 1],
    [0, 1],
  ],
  [
    [0.5, 0],
    [1, 0],
    [1, 1],
    [0.72, 1],
    [0.72, 0.45],
    [0.5, 0.45],
  ],
];

const TOP = pinwheel();

/** Pulls a block toward its middle, so the gap between blocks shows the ink. */
function inset(block: Pt[], k: number): Pt[] {
  const cx = block.reduce((sum, p) => sum + p[0], 0) / block.length;
  const cy = block.reduce((sum, p) => sum + p[1], 0) / block.length;
  return block.map(([x, y]): Pt => [cx + (x - cx) * k, cy + (y - cy) * k]);
}

/** Where a face's (u, v) lands in 3D, for the face whose outward direction is `facing`. */
function onFace(facing: number, u: number, v: number): Vec {
  if (facing < 0) return [u * 2 - 1, v * 2 - 1, 1];
  const a = (facing * Math.PI) / 2;
  const along = u * 2 - 1;
  return [Math.cos(a) - Math.sin(a) * along, Math.sin(a) + Math.cos(a) * along, 1 - v * 2];
}

/** A face's blocks, drawn in ink then in `fill`, turned by `angle`, centred at (cx, cy). */
function face(
  ctx: Ctx,
  facing: number,
  blocks: Pt[][],
  fill: string,
  cx: number,
  cy: number,
  r: number,
  angle: number,
) {
  const project = ([x, y, z]: Vec): Pt => [
    cx + (x * Math.cos(angle) - y * Math.sin(angle)) * r,
    cy + ((x * Math.sin(angle) + y * Math.cos(angle)) * 0.5 - z * 0.85) * r,
  ];
  const path = (points: Pt[]) => {
    ctx.beginPath();
    points.forEach(([u, v], i) => {
      const [px, py] = project(onFace(facing, u, v));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
  };
  path([
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]);
  ctx.fillStyle = theme.colors.ink;
  ctx.fill();
  ctx.fillStyle = fill;
  for (const block of blocks) {
    path(inset(block, 0.93));
    ctx.fill();
  }
}

/** The white interlocking cube, `r` units wide, turned about its vertical axis by `angle`. */
export function drawCube(ctx: Ctx, cx: number, cy: number, r: number, angle: number) {
  // The four sides, nearest the viewer last; a side shows when it faces the viewer.
  const sides = [0, 1, 2, 3]
    .map((facing) => {
      const a = angle + (facing * Math.PI) / 2;
      return { facing, toward: Math.sin(a), lit: Math.cos(a) < 0 };
    })
    .filter((side) => side.toward > 0)
    .sort((p, q) => p.toward - q.toward);
  for (const side of sides) {
    face(
      ctx,
      side.facing,
      SIDE,
      side.lit ? theme.colors.snow : theme.colors.snowShade,
      cx,
      cy,
      r,
      angle,
    );
  }
  face(ctx, -1, TOP, theme.colors.snowLit, cx, cy, r, angle);
}
