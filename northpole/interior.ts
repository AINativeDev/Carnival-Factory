/**
 * The inside of a stall or a pavilion, where a visit takes the player: a small
 * room in the diorama style, cut away at the front. The square's drawing fills
 * the back wall like a stage, its sign hangs over it, and the player walks a
 * few steps on the floor and leaves through the doorway at the front. The
 * room's geometry and walking in it are plain functions, so the map and the
 * tests use them the same way. Points are in screen pixels unless they say
 * otherwise; a place in the room is `{ x, y }` from 0 to 1, across from the
 * left wall and forward from the back wall.
 */
import { isPhone } from './camera';
import { drawPerson, portrait, type Look } from './render';
import type { Box, Tile } from './world';
import { canvasFont, theme } from './theme';

const { colors } = theme;

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

/** Fills a polygon. */
function fill(ctx: CanvasRenderingContext2D, points: Tile[], style: string | CanvasGradient) {
  ctx.fillStyle = style;
  ctx.beginPath();
  points.forEach(({ x, y }, n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws the room in `width` by `height`: the dusk outside, the walls and the
 * floor lit warm from the upper left, the sign with `name` and `by` under it
 * (empty for an attraction), a frame round the stage, and the doorway at the
 * front. The stage itself is left for the square's drawing.
 */
export function drawRoom(
  ctx: CanvasRenderingContext2D,
  room: Room,
  width: number,
  height: number,
  name: string,
  by: string,
  avatar?: CanvasImageSource,
) {
  const { centre, top, back, backHalf, front, frontHalf, sign, stage } = room;
  const rise = room.width * 0.06;
  ctx.fillStyle = colors.night;
  ctx.fillRect(0, 0, width, height);
  const outside = ctx.createLinearGradient(0, 0, 0, height);
  outside.addColorStop(0, colors.dusk);
  outside.addColorStop(1, colors.night);
  ctx.fillStyle = outside;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  const backLeft = centre - backHalf;
  const backRight = centre + backHalf;
  const frontLeft = centre - frontHalf;
  const frontRight = centre + frontHalf;
  // The floor: planks running back to front, darker at the back.
  fill(
    ctx,
    [
      { x: backLeft, y: back },
      { x: backRight, y: back },
      { x: frontRight, y: front },
      { x: frontLeft, y: front },
    ],
    colors.wood,
  );
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = Math.max(1, room.width / 400);
  ctx.globalAlpha = 0.5;
  for (let n = 1; n < 8; n++) {
    ctx.beginPath();
    ctx.moveTo(backLeft + (2 * backHalf * n) / 8, back);
    ctx.lineTo(frontLeft + (2 * frontHalf * n) / 8, front);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const shade = ctx.createLinearGradient(0, back, 0, front);
  shade.addColorStop(0, colors.night);
  shade.addColorStop(1, `${colors.night}00`);
  ctx.globalAlpha = 0.45;
  fill(
    ctx,
    [
      { x: backLeft, y: back },
      { x: backRight, y: back },
      { x: frontRight, y: front },
      { x: frontLeft, y: front },
    ],
    shade,
  );
  ctx.globalAlpha = 1;

  // The side walls: the left one in the light, the right one in shadow.
  fill(
    ctx,
    [
      { x: frontLeft, y: top - rise },
      { x: backLeft, y: top },
      { x: backLeft, y: back },
      { x: frontLeft, y: front },
    ],
    colors.gingerbread,
  );
  fill(
    ctx,
    [
      { x: frontRight, y: top - rise },
      { x: backRight, y: top },
      { x: backRight, y: back },
      { x: frontRight, y: front },
    ],
    colors.cocoa,
  );
  // The back wall, warm where the lamp at the upper left reaches it.
  ctx.fillStyle = colors.wood;
  ctx.fillRect(backLeft, top, backHalf * 2, back - top);
  const lamp = ctx.createRadialGradient(
    backLeft + backHalf * 0.4,
    top,
    0,
    backLeft + backHalf * 0.4,
    top,
    backHalf * 2,
  );
  lamp.addColorStop(0, colors.glow);
  lamp.addColorStop(1, `${colors.glow}00`);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = lamp;
  ctx.fillRect(backLeft, top, backHalf * 2, back - top);
  ctx.globalAlpha = 1;
  // A row of warm bulbs along the top of the back wall.
  for (let n = 0; n <= 12; n++) {
    const x = backLeft + (backHalf * 2 * n) / 12;
    const y = top + room.width * 0.012 + Math.sin((n / 12) * Math.PI * 6) * 2;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.arc(x, y, room.width * 0.012, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = n % 2 ? colors.gold : colors.lantern;
    ctx.beginPath();
    ctx.arc(x, y, room.width * 0.005, 0, Math.PI * 2);
    ctx.fill();
  }

  // The stage's frame, and a light pool on the floor in front of it.
  const rim = room.width * 0.014;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(stage.x - rim * 2, stage.y - rim * 2, stage.w + rim * 4, stage.h + rim * 4);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(stage.x - rim, stage.y - rim, stage.w + rim * 2, stage.h + rim * 2);
  ctx.fillStyle = colors.night;
  ctx.fillRect(stage.x, stage.y, stage.w, stage.h);
  const pool = ctx.createRadialGradient(centre, back, 0, centre, back, stage.w * 0.7);
  pool.addColorStop(0, colors.glow);
  pool.addColorStop(1, `${colors.glow}00`);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(
    centre,
    back + (front - back) * 0.2,
    stage.w * 0.7,
    (front - back) * 0.4,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.globalAlpha = 1;

  // A framed portrait on the wall beside the stage: the owner's avatar for a
  // booth, or the North Pole's emblem for an attraction.
  const hung = portraitBox(room);
  if (hung) {
    const r = hung.w / 2;
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(hung.x - rim * 2, hung.y - rim * 2, hung.w + rim * 4, hung.h + rim * 4);
    ctx.fillStyle = colors.gold;
    ctx.fillRect(hung.x - rim, hung.y - rim, hung.w + rim * 2, hung.h + rim * 2);
    ctx.fillStyle = colors.cream;
    ctx.fillRect(hung.x, hung.y, hung.w, hung.h);
    ctx.save();
    ctx.translate(hung.x + r, hung.y + r);
    if (by) portrait(ctx, r * 0.9, avatar);
    else emblem(ctx, r * 0.9);
    ctx.restore();
  }

  // The sign: the name, and whose it is under it for a booth.
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(sign.x - rim, sign.y - rim, sign.w + rim * 2, sign.h + rim * 2);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(sign.x, sign.y, sign.w, sign.h);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fit = (text: string, font: string, color: string, y: number, tall: number) => {
    ctx.font = font;
    ctx.fillStyle = color;
    const measured = ctx.measureText(text).width || 1;
    const scale = Math.min((sign.w * 0.9) / measured, tall / theme.font.title);
    ctx.save();
    ctx.translate(centre, y);
    ctx.scale(scale, scale);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };
  if (by) {
    fit(name, canvasFont('title', 'bold'), colors.ink, sign.y + sign.h * 0.36, sign.h * 0.5);
    fit(by, canvasFont('title'), colors.berry, sign.y + sign.h * 0.76, sign.h * 0.32);
  } else {
    fit(name, canvasFont('title', 'bold'), colors.ink, sign.y + sign.h / 2, sign.h * 0.6);
  }
  ctx.restore();

  // The doorway: the night showing through the front, and a mat in front of it.
  const doorLeft = frontLeft + 2 * frontHalf * DOOR.from;
  const doorRight = frontLeft + 2 * frontHalf * DOOR.to;
  const mat = (front - back) * 0.12;
  fill(
    ctx,
    [
      { x: doorLeft + mat, y: front - mat },
      { x: doorRight - mat, y: front - mat },
      { x: doorRight, y: front },
      { x: doorLeft, y: front },
    ],
    colors.berry,
  );
  ctx.fillStyle = colors.snow;
  ctx.fillRect(doorLeft, front, doorRight - doorLeft, Math.max(2, room.width * 0.008));
}

/** Where the portrait hangs on the back wall, left of the stage, or undefined when there's no room for it. */
export function portraitBox(room: Room): Box | undefined {
  const { stage, centre, backHalf } = room;
  const free = stage.x - (centre - backHalf);
  const size = Math.min(free * 0.5, stage.h * 0.28);
  if (size < 16) return undefined;
  return { x: stage.x - free / 2 - size / 2, y: stage.y + stage.h * 0.12, w: size, h: size };
}

/** The North Pole's emblem, radius `r` at (0, 0): a gold star on a red disc. */
function emblem(ctx: CanvasRenderingContext2D, r: number) {
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  for (let n = 0; n < 10; n++) {
    const reach = n % 2 ? r * 0.3 : r * 0.72;
    const angle = -Math.PI / 2 + (n * Math.PI) / 5;
    ctx.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach);
  }
  ctx.closePath();
  ctx.fill();
}

/** Draws the player standing at `at` in the room. */
export function drawRoomPerson(
  ctx: CanvasRenderingContext2D,
  room: Room,
  at: Tile,
  look: Look,
  facing: number,
  moving: boolean,
  time: number,
) {
  const { x, y, scale } = roomToScreen(room, at);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  drawPerson(ctx, { x: 0, y: 0 }, look, facing, moving, time);
  ctx.restore();
}
