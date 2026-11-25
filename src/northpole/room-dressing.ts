/**
 * Everything that makes a square's room its own, drawn over the bare room
 * (interior.ts) before the square's drawing: walls that match its stall
 * outside, a window onto the dusk, a lamp's warm glow, snow blowing in at
 * the door, and its build story pinned to the back wall. The visit page is
 * where people see how a booth was built, so the room tells it too
 * (docs/specs/squares-and-sandbox.md).
 */
import { storySteps } from '../build-story';
import { creditsFor, historyOf, SQUARE_HISTORY } from '../history';
import type { SquareHistory } from '../../scripts/square-history';
import { DOOR, type Room } from './interior';
import { drawPinboard } from './pinboard';
import { pinnedNotes } from './pinboard-layout';
import { drawSideWalls, drawWindow, flakes, wallStyle } from './room-walls';
import type { NorthPoleSquare } from './square';
import { theme } from './theme';

const { colors } = theme;

/** Which square a room belongs to: only booths and attractions have a build story. */
export interface RoomOwner {
  kind: string;
  id?: string;
}

/** The notes on a square's board, from the build's history; none for anything else. */
export function roomNotes(owner: RoomOwner, data: SquareHistory | undefined = SQUARE_HISTORY) {
  if ((owner.kind !== 'booth' && owner.kind !== 'attraction') || !owner.id) return [];
  const steps = storySteps(
    historyOf(data, owner.kind, owner.id),
    creditsFor(data, owner.kind, owner.id),
  );
  return pinnedNotes(steps);
}

/** A lamp's warm light from the upper left, the way the diorama style lights everything. */
function drawGlow(ctx: CanvasRenderingContext2D, room: Room) {
  const x = room.centre - room.backHalf;
  const r = room.width * 0.6;
  const glow = ctx.createRadialGradient(x, room.top, 0, x, room.top, r);
  glow.addColorStop(0, colors.glow);
  glow.addColorStop(1, `${colors.glow}00`);
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = glow;
  ctx.fillRect(x - r, room.top - r, r * 2, r * 2);
  ctx.restore();
}

/** Snow drifting in through the doorway and settling just inside it. */
function drawDoorSnow(ctx: CanvasRenderingContext2D, room: Room, time: number) {
  const left = room.centre - room.frontHalf + room.frontHalf * 2 * DOOR.from;
  const span = room.frontHalf * 2 * (DOOR.to - DOOR.from);
  const depth = (room.front - room.back) * 0.25;
  ctx.save();
  ctx.fillStyle = colors.snowLit;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(left + span / 2, room.front, span * 0.55, depth * 0.18, 0, Math.PI, 0);
  ctx.fill();
  ctx.globalAlpha = 0.8;
  for (const flake of flakes(14, time)) {
    ctx.beginPath();
    ctx.arc(left + flake.x * span, room.front - flake.y * depth, flake.size * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Dresses the room of `square`, owned as `owner` says, at `time` in seconds. */
export function dressRoom(
  ctx: CanvasRenderingContext2D,
  room: Room,
  square: NorthPoleSquare,
  owner: RoomOwner,
  time: number,
) {
  drawSideWalls(ctx, room, wallStyle(square.stall));
  drawWindow(ctx, room, time);
  drawGlow(ctx, room);
  drawDoorSnow(ctx, room, time);
  drawPinboard(ctx, room, roomNotes(owner));
}
