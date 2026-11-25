/**
 * The build story pinned on the room's back wall, beside the square's drawing:
 * the request a letter, each factory build a blueprint stamped with how its
 * review went, and the map a gold star. It shows at a glance what the panel
 * tells in words: someone asked, the factory built it, and here it is.
 */
import type { Room } from './interior';
import { notesThatFit, type PinnedNote, pinboardBox } from './pinboard-layout';
import { theme } from './theme';
import type { Box } from './world';

const { colors } = theme;

/** How many notes the board shows at once. */
const ROWS = 4;

const PAPER: Record<PinnedNote['paper'], string> = {
  letter: colors.cream,
  note: colors.snowLit,
  blueprint: colors.ice,
  star: colors.night,
};

/** Text fitted inside `width`, at most `size` pixels tall. */
function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  size: number,
  color: string,
  bold = false,
) {
  ctx.font = `${bold ? 'bold' : 'normal'} ${String(theme.font.title)}px ${theme.font.family}`;
  const measured = Math.max(1, ctx.measureText(text).width);
  const scale = Math.min(width / measured, size / theme.font.title);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** A five-pointed star of radius `r` at (x, y). */
function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let n = 0; n < 10; n++) {
    const angle = -Math.PI / 2 + (n * Math.PI) / 5;
    const reach = n % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach);
  }
  ctx.closePath();
  ctx.fill();
}

/** One note, slightly askew, with a pin at the top. */
function drawNote(ctx: CanvasRenderingContext2D, note: PinnedNote, box: Box, tilt: number) {
  const { x, y, w, h } = box;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(tilt);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(-w / 2 + w * 0.04, -h / 2 + h * 0.06, w, h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = PAPER[note.paper];
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (note.paper === 'blueprint') {
    ctx.strokeStyle = colors.snow;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    for (let n = 1; n < 4; n++) {
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2 + (h * n) / 4);
      ctx.lineTo(w / 2, -h / 2 + (h * n) / 4);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (note.paper === 'letter') {
    ctx.strokeStyle = colors.wood;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(0, -h * 0.1);
    ctx.lineTo(w / 2, -h / 2);
    ctx.stroke();
  }
  if (note.paper === 'star') {
    ctx.fillStyle = colors.gold;
    star(ctx, 0, -h * 0.12, Math.min(w, h) * 0.28);
    label(ctx, note.title, 0, h * 0.3, w * 0.85, h * 0.2, colors.glow, true);
  } else {
    const ink = note.paper === 'blueprint' ? colors.night : colors.ink;
    label(ctx, note.title, 0, -h * 0.08, w * 0.8, h * 0.3, ink, true);
    if (note.line) label(ctx, note.line, 0, h * 0.24, w * 0.85, h * 0.2, ink);
  }
  if (note.stamp) {
    ctx.save();
    ctx.translate(w * 0.18, h * 0.32);
    ctx.rotate(-0.3);
    ctx.strokeStyle = colors.berry;
    ctx.lineWidth = Math.max(1, w / 40);
    ctx.strokeRect(-w * 0.3, -h * 0.11, w * 0.6, h * 0.22);
    label(ctx, note.stamp, 0, 0, w * 0.52, h * 0.16, colors.berry, true);
    ctx.restore();
  }
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.arc(0, -h / 2 + h * 0.06, Math.max(2, w * 0.05), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The board and its notes, one under another; nothing when there's no story or no room for it. */
export function drawPinboard(ctx: CanvasRenderingContext2D, room: Room, notes: PinnedNote[]) {
  const board = pinboardBox(room);
  if (!board || notes.length === 0) return;
  const rim = Math.max(3, board.w * 0.04);
  ctx.save();
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(board.x - rim, board.y - rim, board.w + rim * 2, board.h + rim * 2);
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(board.x, board.y, board.w, board.h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const heading = board.h * 0.1;
  label(
    ctx,
    'How it was built',
    board.x + board.w / 2,
    board.y + heading * 0.6,
    board.w * 0.85,
    heading * 0.6,
    colors.cream,
    true,
  );
  // One column of notes big enough to read: the wall beside the stage is narrow.
  const shown = notesThatFit(notes, ROWS);
  const cellH = (board.h - heading) / ROWS;
  shown.forEach((note, n) => {
    const cell = {
      x: board.x + board.w * 0.1,
      y: board.y + heading + n * cellH + cellH * 0.08,
      w: board.w * 0.8,
      h: cellH * 0.84,
    };
    drawNote(ctx, note, cell, ((n * 7) % 5) * 0.025 - 0.05);
  });
  ctx.restore();
}
