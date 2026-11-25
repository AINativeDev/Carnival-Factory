/**
 * Every plot's structure in the scene: a square's stall or pavilion with its
 * drawing on its face, a construction site, a sleigh platform, with the glow,
 * ring and bounce of the plot the player is at or has picked, the sign on a
 * booth being updated, and the sparkles of one that just landed. Kept apart
 * from the scene because it's where each square's own drawing meets the map.
 */
import { drawSquare } from './draw-square';
import { ownerOf, platformLabel, siteLabel, squareOf } from './map-labels';
import type { AddToScene } from './map-crowd';
import type { PointerTracker } from './map-pointer';
import type { SceneFrame } from './map-scene';
import type { MapRun } from './map-state';
import { onMapping } from './pointer';
import { drawPlot } from './render';
import { drawSparkles } from './plot-marks';
import { drawSelectionRing } from './plot-marks';
import { drawUpdateSign } from './platform';
import { type Mapping } from './faces';
import { drawSite } from './site';
import { drawPlatform } from './platform';
import { SPARKLE_TIME } from './plot-marks';
import { drawPlotGlow } from './plot-marks';
import type { NorthPoleSquare, SquarePointer } from './square';
import type { Box, Plot, Tile } from './world';

/**
 * The square in front under the pointer this frame, if any: the pointer on the
 * screen and in world pixels, and the plot it stands on. `pointed` names it
 * once its face is drawn with the pointer on it.
 */
export interface Aim {
  target:
    | {
        pressed: NonNullable<ReturnType<PointerTracker['now']>>;
        aimed: Tile;
        under: Plot;
        square: NorthPoleSquare;
      }
    | undefined;
  pointed: string;
}

/** Adds every plot in view to the scene, and notes where each was drawn, for clicks. */
export function addPlots(
  m: MapRun,
  add: AddToScene,
  shown: (box: Box) => boolean,
  aim: Aim,
  picked: number,
  frame: SceneFrame,
) {
  const paint = painter(m, aim, frame);
  for (const plot of m.world.plots) {
    if (!shown(plot)) continue;
    add(plot.x + plot.w + plot.y + plot.h - 2, () => {
      const highlight = plot === m.selected ? picked : 0;
      const owner = ownerOf(m, plot);
      const strength = Math.max(plot === m.near ? 0.7 : 0, owner?.you ? 0.45 : 0, highlight);
      if (strength > 0) drawPlotGlow(m.ctx, plot, strength);
      drawSelectionRing(m.ctx, plot, highlight);
      const box = drawStand(m, plot, paint, frame.motion, owner);
      decorate(m, plot, frame);
      m.targets.push({ plot, box });
    });
  }
}

/** Draws a plot's structure, and gives back the box it covers. */
function drawStand(
  m: MapRun,
  plot: Plot,
  paint: (square: NorthPoleSquare, mapping: Mapping) => void,
  motion: number,
  owner: ReturnType<typeof ownerOf>,
): Box {
  const { ctx } = m;
  const bounce = plot === m.near || plot === m.claiming;
  if (plot.kind === 'site') return drawSite(ctx, plot, siteLabel(m, plot), motion, plot === m.near);
  if (plot.kind === 'platform' || plot.kind === 'exit')
    return drawPlatform(ctx, plot, platformLabel(m, plot), motion, plot === m.near);
  return drawPlot(ctx, plot, squareOf(m, plot), paint, motion, bounce, owner);
}

/** A booth's "Being updated" sign, and the sparkles of a booth that replaced its construction site. */
function decorate(m: MapRun, plot: Plot, { time, still }: SceneFrame) {
  if (plot.kind !== 'booth') return;
  const login = String(plot.id);
  if (m.pending.has(login)) drawUpdateSign(m.ctx, plot);
  if (!m.landed.has(login)) return;
  // The booth that replaced its construction site sparkles once, the first time it's in view.
  const began = m.landed.get(login) ?? time;
  m.landed.set(login, began);
  if (still || time - began >= SPARKLE_TIME) m.landed.delete(login);
  else drawSparkles(m.ctx, plot, time - began);
}

/** Paints a square onto its face of a structure, with the pointer if it's over that square. */
function painter(m: MapRun, aim: Aim, { time, k }: SceneFrame) {
  return (square: NorthPoleSquare, mapping: Mapping) => {
    const { ctx } = m;
    const { origin, u, v } = mapping;
    // The square draws at the resolution its face shows at, so its drawing stays sharp,
    // and the face's own angles map it onto the world.
    const size = Math.max(16, Math.min(512, Math.round(Math.hypot(u.x, u.y) * k)));
    const target = aim.target?.square === square ? aim.target : undefined;
    let pointer: SquarePointer | undefined;
    if (target) {
      const inside = onMapping(target.aimed, mapping, size);
      if (inside) {
        aim.pointed = `${target.under.kind}:${square.id}`;
        pointer = { ...inside, down: target.pressed.down, presses: target.pressed.presses };
      }
    }
    ctx.save();
    ctx.transform(u.x / size, u.y / size, v.x / size, v.y / size, origin.x, origin.y);
    drawSquare(ctx, m.scratch, square, 0, 0, size, time, pointer);
    ctx.restore();
  };
}
