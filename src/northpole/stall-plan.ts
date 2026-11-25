/**
 * The plan of a booth's stall and an attraction's pavilion, as numbers: how
 * tall each part stands, each stall shape's outline on its plot and its walls
 * and roof, its colours, and where a click opens it. Kept as plain functions
 * apart from the drawing, so the map, the tests and every shape share one plan.
 */
import { corners } from './brushes';
import { onFace, type Face, type PaintSquare } from './faces';
import type { Owner } from './name-board';
import { SHAPE_PLANS } from './stall-catalogue';
import type { NorthPoleSquare, StallShape, StallStyle } from './square';
import { theme } from './theme';
import type { Box, Plot, Tile } from './world';

const { colors } = theme;

/** How tall each part of a booth's stall, and of an attraction's pavilion, is, in world pixels. */
export const STALL = { counter: 16, art: 18, wall: 104 };
export const PAVILION = { stage: 10, art: 24, wall: 150, roof: 64 };

/** Where a click opens a plot: round everything standing on it. */
export function standing(plot: Box, height: number): Box {
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
  const { ring } = SHAPE_PLANS[shape];
  if (!ring) {
    return [
      { along: 0, depth: 0 },
      { along: 1, depth: 0 },
      { along: 1, depth: 1 },
      { along: 0, depth: 1 },
    ];
  }
  return Array.from({ length: ring.sides }, (_, n) => {
    const angle = ring.turn + (n / ring.sides) * Math.PI * 2;
    return {
      along: 0.5 + Math.cos(angle) * ring.radius,
      depth: 0.5 + Math.sin(angle) * ring.radius,
    };
  });
}

/** The colours a stall is drawn in: its shape, its roof, and its trim for stripes and the awning. */
export function stallLook(stall: StallStyle): {
  shape: StallShape;
  roof: string;
  trim: string;
} {
  const trim = stall.trim ?? SHAPE_PLANS[stall.shape].trim;
  return { shape: stall.shape, roof: colors[stall.roof], trim: colors[trim] };
}

/** Where a point on a stall's plot is on screen, `lift` up. */
export function plotPoint(face: Face, deep: number, at: OnPlot, lift = 0): Tile {
  return onFace(face, at.along, lift, -at.depth * deep);
}

/** Where a stall's name board starts, just over the drawing on its front. */
export function stallSignLow(face: Face): number {
  return STALL.art + Math.abs(face.b.x - face.a.x) * 0.84 + 5;
}

/** How high a stall of `shape` reaches over its plot, with its awning, pennant or finial. */
export function stallReach(shape: StallShape): number {
  const { wall, roof, extra } = SHAPE_PLANS[shape];
  return Math.max(STALL.wall, wall + roof) + extra;
}

/** Everything a stall shape's drawing needs: where it stands, which way it faces, its look and its square. */
export interface StallParts {
  plot: Plot;
  face: Face;
  /** How deep the plot runs back from its front, in tiles. */
  deep: number;
  /** The shape's outline on the ground, on screen. */
  ground: Tile[];
  wall: number;
  roof: number;
  look: ReturnType<typeof stallLook>;
  square: NorthPoleSquare;
  paint: PaintSquare;
  owner: Owner;
  /** The map's clock, for a shape that moves: a windmill's sails, a lighthouse's lamp. */
  time: number;
}
