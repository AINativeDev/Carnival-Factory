/**
 * Inside a square: its drawing as big as the screen allows beside the panel,
 * in the mood it chose round it (visit-scenes.ts), so the page round it
 * blends in, and the fade in or out over it. Where it stands is visit-stage.ts; this is the map's frame while the
 * player is inside.
 */
import { drawSquare } from './draw-square';
import { MAX_SIZE } from './frame-protocol';
import { roomArea } from './interior';
import { darken } from './map-backdrop';
import type { MapRun } from './map-state';
import { timeFrame } from './map-timing';
import { onRect } from './pointer';
import type { NorthPoleSquare } from './square';
import { drawScene } from './visit-scenes';
import { boothBox, isPhoneUpright, wideBox } from './visit-stage';
import type { Spot } from './world';

/** What a visit's frame is drawn with. */
export interface RoomFrame {
  width: number;
  height: number;
  time: number;
  /** How dark the fade is, from 0 to 1. */
  dark: number;
}

/** The square the player is inside, drawn as big as fits, sharp at the screen's own pixels. */
export function drawInside(m: MapRun, spot: Spot, square: NorthPoleSquare, frame: RoomFrame) {
  const started = performance.now();
  const { ctx, canvas, scale } = m;
  const { width, height, time } = frame;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  // Cleared, not filled: the glow goes in behind the drawing once it's drawn.
  ctx.clearRect(0, 0, width, height);
  // A phone held upright has the panel as a sheet below: the booth fills its width.
  const stage = isPhoneUpright(width, height) ? wideBox(width) : boothBox(roomArea(width, height));
  const size = Math.min(MAX_SIZE, Math.round(stage.w * scale));
  // The stage is the square's drawing scaled, so the pointer scales with it.
  const pressed = m.pointer.now();
  const onStage = pressed && onRect(pressed, stage, size);
  // A square's spot always has its id: its owner's login, or the attraction's.
  const pointed = onStage ? `${spot.kind}:${String(spot.id)}` : '';
  if (canvas.dataset.pointer !== pointed) canvas.dataset.pointer = pointed;
  ctx.save();
  ctx.translate(stage.x, stage.y);
  ctx.scale(stage.w / size, stage.h / size);
  const pointer = pressed &&
    onStage && { ...onStage, down: pressed.down, presses: pressed.presses };
  drawSquare(ctx, m.scratch, square, 0, 0, size, time, pointer);
  ctx.restore();
  drawScene(square.stall?.scene, { ctx, width, height, stage, scratch: m.scratch, size });
  darken(ctx, frame.dark, width, height);
  const at = [stage.x, stage.y, stage.w, stage.h].map((n) => Math.round(n * scale)).join(',');
  if (canvas.dataset.stage !== at) canvas.dataset.stage = at;
  timeFrame(m, started);
}
