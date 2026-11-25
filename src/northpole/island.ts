/**
 * The island the North Pole stands on, drawn once to its own layer: the snow
 * slab's thickness with icicles under its front edges, its shadow, the ground,
 * the dusk over it, and the fence round its edges with string lights along it.
 */
import { bulb, quad, twinkle } from './brushes';
import { alongEdge } from './camera';
import { drawGround } from './ground';
import { inTurn } from './rounds';
import { theme } from './theme';
import { hash, type Tile, type World } from './world';

const { colors } = theme;

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
  slabFace(ctx, left, bottom, colors.slab, slab);
  slabFace(ctx, bottom, right, colors.slabShade, slab);
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

/** The string lights' colours, in turn along the fence and round a picked plot. */
export const LIGHTS = [colors.lantern, colors.berry, colors.gold, colors.mint] as const;

/** String lights along the fence, glowing and gently twinkling: on its back edges or its front ones. */
export function drawStringLights(
  ctx: CanvasRenderingContext2D,
  island: Island,
  front: boolean,
  time: number,
) {
  const edges: [Tile, Tile][] = front
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
      bulb(ctx, p.x, p.y - FENCE + 4 + sag, inTurn(LIGHTS, n), twinkle(time, n));
      n++;
    }
}

/** One of the slab's front faces from `a` to `b`, `slab` thick: layers in the snow, and icicles hanging from its foot. */
function slabFace(ctx: CanvasRenderingContext2D, a: Tile, b: Tile, color: string, slab: number) {
  ctx.fillStyle = color;
  quad(ctx, [a, b, { x: b.x, y: b.y + slab }, { x: a.x, y: a.y + slab }]);
  ctx.fill();
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
}
