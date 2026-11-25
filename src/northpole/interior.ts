/**
 * The inside of a stall or a pavilion, where a visit takes the player: a small
 * room in the diorama style, cut away at the front. The square's drawing fills
 * the back wall like a stage, its sign hangs over it, and the player walks a
 * few steps on the floor and leaves through the doorway at the front. The
 * room's geometry and walking in it are plain functions, so the map and the
 * tests use them the same way. Points are in screen pixels unless they say
 * otherwise; a place in the room is `{ x, y }` from 0 to 1, across from the
 * left wall and forward from the back wall. Drawing the room is in
 * interior-room.ts and interior-stage.ts.
 */
import { isPhone } from './camera';
import type { Box, Tile } from './world';

/** The room on screen: its back wall, its floor's back and front edges, its sign and its stage. */
export interface Room {
  /** The room's width at the front, and its middle across. */
  width: number;
  centre: number;
  /** The back wall's top and bottom, and its half-width. */
  top: number;
  back: number;
  backHalf: number;
  /** The front edge of the floor, and its half-width. */
  front: number;
  frontHalf: number;
  /** The sign over the stage, and the stage the square's drawing fills. */
  sign: Box;
  stage: Box;
}

/** How far across the floor the doorway reaches, in room units. */
export const DOOR = { from: 0.38, to: 0.62 };
/** How far the player can come up to the back wall, and how far in from the sides, in room units. */
const NEAR_WALL = 0.2;
const NEAR_SIDE = 0.06;
/** Where the player stands on coming in: just inside the doorway. */
export const ENTRANCE: Tile = { x: 0.5, y: 0.85 };
/** How fast the player walks inside, in room units a second. */
export const ROOM_SPEED = 0.5;
/** How long the fade in or out of a room takes, in milliseconds. */
export const FADE = 500;

/**
 * The part of the viewport the room stands in: left of the HUD on a wide
 * screen, and above it on a phone's.
 */
export function roomArea(width: number, height: number): Box {
  if (isPhone(width)) return { x: 0, y: 0, w: width, h: height * 0.55 };
  return { x: 0, y: 0, w: Math.max(width * 0.5, width - 380), h: height };
}

/** Lays the room out in `area`, as large as fits. */
export function roomLayout(area: Box): Room {
  // The side walls rise 0.06 of the width over the back wall, which is 0.6 of
  // it tall, and the floor comes 0.25 of it forward.
  const width = Math.min(area.w * 0.92, (area.h * 0.9) / 0.91);
  const centre = area.x + area.w / 2;
  const top = area.y + (area.h - width * 0.91) / 2 + width * 0.06;
  const back = top + width * 0.6;
  const backHalf = width * 0.38;
  const signH = width * 0.08;
  const sign = { x: centre - width * 0.24, y: top + width * 0.025, w: width * 0.48, h: signH };
  const side = back - width * 0.03 - (sign.y + signH + width * 0.025);
  return {
    width,
    centre,
    top,
    back,
    backHalf,
    front: back + width * 0.25,
    frontHalf: width / 2,
    sign,
    stage: { x: centre - side / 2, y: sign.y + signH + width * 0.025, w: side, h: side },
  };
}

/** Where a place in the room is on screen, and how large a person standing there is. */
export function roomToScreen(room: Room, at: Tile): Tile & { scale: number } {
  const depth = Math.max(0, Math.min(1.2, at.y));
  const half = room.backHalf + (room.frontHalf - room.backHalf) * depth;
  return {
    x: room.centre + (at.x - 0.5) * 2 * half,
    y: room.back + (room.front - room.back) * depth,
    scale: (room.width / 520) * (0.85 + 0.25 * depth),
  };
}

/** The place in the room under a point on screen: past 1 forward is out through the front. */
export function screenToRoom(room: Room, point: Tile): Tile {
  const y = (point.y - room.back) / (room.front - room.back);
  const depth = Math.max(0, Math.min(1.2, y));
  const half = room.backHalf + (room.frontHalf - room.backHalf) * depth;
  return { x: 0.5 + (point.x - room.centre) / (2 * half), y };
}

/** Whether a place in the room is in the doorway, across. */
const inDoorway = (x: number) => x >= DOOR.from && x <= DOOR.to;

/**
 * One step inside the room, by `dx` across and `dy` forward, in room units:
 * the player stays clear of the walls, and stepping forward past the front
 * through the doorway walks out. `out` says they did.
 */
export function stepInRoom(at: Tile, dx: number, dy: number): { at: Tile; out: boolean } {
  const x = Math.max(NEAR_SIDE, Math.min(1 - NEAR_SIDE, at.x + dx));
  const y = at.y + dy;
  if (y > 1 && inDoorway(x)) return { at: { x, y: 1 }, out: true };
  return { at: { x, y: Math.max(NEAR_WALL, Math.min(1, y)) }, out: false };
}

/**
 * Where a click in the room sends the player: a place on the floor, or out
 * through the doorway for a click on it or in front of it. Undefined for a
 * click anywhere else.
 */
export function clickInRoom(room: Room, point: Tile): { to: Tile; out: boolean } | undefined {
  const at = screenToRoom(room, point);
  if (at.y > 0.92 && inDoorway(at.x)) return { to: { x: at.x, y: 1.05 }, out: true };
  if (at.y < 0 || at.y > 1 || at.x < 0 || at.x > 1) return undefined;
  return { to: stepInRoom(at, 0, 0).at, out: false };
}

/** How dark the fade into or out of a room is, from 0 to 1, `elapsed` milliseconds after it began. */
export function fadeAt(elapsed: number, duration = FADE): number {
  if (elapsed < 0 || elapsed >= duration) return 0;
  return 1 - Math.abs(elapsed - duration / 2) / (duration / 2);
}
