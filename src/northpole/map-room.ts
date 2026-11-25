/**
 * Inside a square: its room, dressed as its own, with the square's drawing on
 * the stage at the back, the player standing in it, and the fade in or out over
 * it all. The room's own layout and drawing are in interior.ts and
 * room-dressing.ts; this is the map's frame while the player is inside.
 */
import { drawSquare } from './draw-square';
import { roomArea, roomLayout } from './interior';
import { drawRoom } from './interior-room';
import { drawRoomPerson } from './interior-room';
import { darken } from './map-backdrop';
import { PLAYER } from './map-crowd';
import { avatarOf } from './map-labels';
import type { MapRun } from './map-state';
import { timeFrame } from './map-timing';
import { onRect } from './pointer';
import { dressRoom } from './room-dressing';
import type { NorthPoleSquare } from './square';
import type { Plot } from './world';

/** The size a square draws at on the back wall of its room, in pixels. */
const VISIT_SIZE = 480;

/** What a room's frame is drawn with. */
export interface RoomFrame {
  width: number;
  height: number;
  time: number;
  /** How dark the fade is, from 0 to 1. */
  dark: number;
}

/** The room the player is inside, dressed as its own, with the square's drawing on the stage. */
export function drawInside(m: MapRun, plot: Plot, square: NorthPoleSquare, frame: RoomFrame) {
  const started = performance.now();
  const { ctx, canvas, scale } = m;
  const { width, height, time } = frame;
  const room = roomLayout(roomArea(width, height));
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const booth = plot.kind === 'booth';
  // A square's plot always has its id: its owner's login, or the attraction's.
  const login = String(plot.id);
  drawRoom(
    ctx,
    room,
    width,
    height,
    square.name,
    booth ? `by @${login}` : '',
    booth ? avatarOf(m, login) : undefined,
  );
  dressRoom(ctx, room, square, plot, time);
  const { stage } = room;
  // The stage is the square's drawing scaled, so the pointer scales with it.
  const pressed = m.pointer.now();
  const onStage = pressed && onRect(pressed, stage, VISIT_SIZE);
  const pointed = onStage ? `${plot.kind}:${login}` : '';
  if (canvas.dataset.pointer !== pointed) canvas.dataset.pointer = pointed;
  ctx.save();
  ctx.translate(stage.x, stage.y);
  ctx.scale(stage.w / VISIT_SIZE, stage.h / VISIT_SIZE);
  const pointer = pressed &&
    onStage && { ...onStage, down: pressed.down, presses: pressed.presses };
  drawSquare(ctx, m.scratch, square, 0, 0, VISIT_SIZE, time, pointer);
  ctx.restore();
  drawRoomPerson(ctx, room, m.inside, PLAYER, m.insideFacing, m.moving, time);
  darken(ctx, frame.dark, width, height);
  const at = [stage.x, stage.y, stage.w, stage.h].map((n) => Math.round(n * scale)).join(',');
  if (canvas.dataset.stage !== at) canvas.dataset.stage = at;
  const place = `${m.inside.x.toFixed(2)},${m.inside.y.toFixed(2)}`;
  if (canvas.dataset.room !== place) canvas.dataset.room = place;
  timeFrame(m, started);
}
