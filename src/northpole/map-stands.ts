/**
 * Every spot's structure in the scene: a square's stall or pavilion with its
 * drawing on its face, a construction site, a sleigh platform, with the glow,
 * ring and bounce of the spot the player is at or has picked, the sign on a
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
import { drawSpot } from './render';
import { drawSparkles } from './spot-marks';
import { drawSelectionRing } from './spot-marks';
import { drawUpdateSign } from './platform';
import { type Mapping } from './faces';
import { drawSite } from './site';
import { drawPlatform } from './platform';
import { SPARKLE_TIME } from './spot-marks';
import { drawSpotGlow } from './spot-marks';
import type { NorthPoleSquare, SquarePointer } from './square';
import type { Box, Spot, Tile } from './world';

/**
 * The square in front under the pointer this frame, if any: the pointer on the
 * screen and in world pixels, and the spot it stands on. `pointed` names it
 * once its face is drawn with the pointer on it.
 */
export interface Aim {
  target:
    | {
        pressed: NonNullable<ReturnType<PointerTracker['now']>>;
        aimed: Tile;
        under: Spot;
        square: NorthPoleSquare;
      }
    | undefined;
  pointed: string;
}

/** Adds every spot in view to the scene, and notes where each was drawn, for clicks. */
export function addSpots(
  m: MapRun,
  add: AddToScene,
  shown: (box: Box) => boolean,
  aim: Aim,
  picked: number,
  frame: SceneFrame,
) {
  const paint = painter(m, aim, frame);
  for (const spot of m.world.spots) {
    if (!shown(spot)) continue;
    add(spot.x + spot.w + spot.y + spot.h - 2, () => {
      const highlight = spot === m.selected ? picked : 0;
      const owner = ownerOf(m, spot);
      const strength = Math.max(spot === m.near ? 0.7 : 0, owner?.you ? 0.45 : 0, highlight);
      if (strength > 0) drawSpotGlow(m.ctx, spot, strength);
      drawSelectionRing(m.ctx, spot, highlight);
      const box = drawStand(m, spot, paint, frame.motion, owner);
      decorate(m, spot, frame);
      m.targets.push({ spot, box });
    });
  }
}

/** Draws a spot's structure, and gives back the box it covers. */
function drawStand(
  m: MapRun,
  spot: Spot,
  paint: (square: NorthPoleSquare, mapping: Mapping) => void,
  motion: number,
  owner: ReturnType<typeof ownerOf>,
): Box {
  const { ctx } = m;
  const bounce = spot === m.near || spot === m.claiming;
  if (spot.kind === 'site') return drawSite(ctx, spot, siteLabel(m, spot), motion, spot === m.near);
  if (spot.kind === 'platform' || spot.kind === 'exit')
    return drawPlatform(ctx, spot, platformLabel(m, spot), motion, spot === m.near);
  return drawSpot(ctx, spot, squareOf(m, spot), paint, motion, bounce, owner);
}

/** A booth's "Being updated" sign, and the sparkles of a booth that replaced its construction site. */
function decorate(m: MapRun, spot: Spot, { time, still }: SceneFrame) {
  if (spot.kind !== 'booth') return;
  const login = String(spot.id);
  if (m.pending.has(login)) drawUpdateSign(m.ctx, spot);
  if (!m.landed.has(login)) return;
  // The booth that replaced its construction site sparkles once, the first time it's in view.
  const began = m.landed.get(login) ?? time;
  m.landed.set(login, began);
  if (still || time - began >= SPARKLE_TIME) m.landed.delete(login);
  else drawSparkles(m.ctx, spot, time - began);
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
    ctx.transform(
      u.x / size,
      u.y / size,
      // Stryker disable next-line ArithmeticOperator: every face stands upright, so v.x is 0 however it is scaled
      v.x / size,
      v.y / size,
      origin.x,
      origin.y,
    );
    drawSquare(ctx, m.scratch, square, 0, 0, size, time, pointer);
    ctx.restore();
  };
}
