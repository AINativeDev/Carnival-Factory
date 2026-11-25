/**
 * Drawing the room inside a square: the dusk outside, the walls and the plank
 * floor lit warm from the upper left, the bulbs along the back wall and the
 * doorway at the front, with the stage, portrait and sign from
 * interior-stage.ts, and the player standing in it. The room's geometry and
 * walking in it stay in interior.ts as plain functions, apart from the drawing.
 */
import { DOOR, roomToScreen, type Room } from './interior';
import { hangPortrait, hangSign, drawStage } from './interior-stage';
import { drawPerson, type Look } from './people';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** Fills a polygon. */
function fill(ctx: CanvasRenderingContext2D, points: Tile[], style: string | CanvasGradient) {
  ctx.fillStyle = style;
  ctx.beginPath();
  points.forEach(({ x, y }, n) => {
    if (n) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

/** The night outside the room, with the dusk fading down into it. */
function outside(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = colors.night;
  ctx.fillRect(0, 0, width, height);
  const dusk = ctx.createLinearGradient(0, 0, 0, height);
  dusk.addColorStop(0, colors.dusk);
  dusk.addColorStop(1, colors.night);
  ctx.fillStyle = dusk;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
}

/** The floor's four corners on screen: the back wall's foot and the front edge. */
function floorOutline({ centre, back, backHalf, front, frontHalf }: Room): Tile[] {
  return [
    { x: centre - backHalf, y: back },
    { x: centre + backHalf, y: back },
    { x: centre + frontHalf, y: front },
    { x: centre - frontHalf, y: front },
  ];
}

/** The floor: planks running back to front, darker at the back. */
function floor(ctx: CanvasRenderingContext2D, room: Room) {
  const { centre, back, backHalf, front, frontHalf } = room;
  fill(ctx, floorOutline(room), colors.wood);
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = Math.max(1, room.width / 400);
  ctx.globalAlpha = 0.5;
  for (let n = 1; n < 8; n++) {
    ctx.beginPath();
    ctx.moveTo(centre - backHalf + (2 * backHalf * n) / 8, back);
    ctx.lineTo(centre - frontHalf + (2 * frontHalf * n) / 8, front);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const shade = ctx.createLinearGradient(0, back, 0, front);
  shade.addColorStop(0, colors.night);
  shade.addColorStop(1, `${colors.night}00`);
  ctx.globalAlpha = 0.45;
  fill(ctx, floorOutline(room), shade);
  ctx.globalAlpha = 1;
}

/** The side walls, the left one in the light and the right one in shadow. */
function sideWalls(ctx: CanvasRenderingContext2D, room: Room) {
  const { centre, top, back, backHalf, front, frontHalf } = room;
  const rise = room.width * 0.06;
  for (const [side, colour] of [
    [-1, colors.gingerbread],
    [1, colors.cocoa],
  ] as const) {
    fill(
      ctx,
      [
        { x: centre + side * frontHalf, y: top - rise },
        { x: centre + side * backHalf, y: top },
        { x: centre + side * backHalf, y: back },
        { x: centre + side * frontHalf, y: front },
      ],
      colour,
    );
  }
}

/** The back wall, warm where the lamp at the upper left reaches it, with a row of warm bulbs along its top. */
function backWall(ctx: CanvasRenderingContext2D, room: Room) {
  const { centre, top, back, backHalf } = room;
  const backLeft = centre - backHalf;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(backLeft, top, backHalf * 2, back - top);
  const lampX = backLeft + backHalf * 0.4;
  const lamp = ctx.createRadialGradient(lampX, top, 0, lampX, top, backHalf * 2);
  lamp.addColorStop(0, colors.glow);
  lamp.addColorStop(1, `${colors.glow}00`);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = lamp;
  ctx.fillRect(backLeft, top, backHalf * 2, back - top);
  ctx.globalAlpha = 1;
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
}

/** The doorway: the night showing through the front, and a mat in front of it. */
function doorway(ctx: CanvasRenderingContext2D, room: Room) {
  const { centre, back, front, frontHalf } = room;
  const frontLeft = centre - frontHalf;
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
  outside(ctx, width, height);
  floor(ctx, room);
  sideWalls(ctx, room);
  backWall(ctx, room);
  drawStage(ctx, room);
  hangPortrait(ctx, room, by, avatar);
  hangSign(ctx, room, name, by);
  doorway(ctx, room);
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
