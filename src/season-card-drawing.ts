/**
 * The season card's picture: the dusk sky, the participant's booth framed on
 * the left, and who it belongs to and their numbers on the right, painted in
 * the card's own units. Kept apart from the page that shows it
 * (src/season-card.ts), so the drawing is pinned by a test of its own.
 */
import { backdrop } from './northpole/diorama';
import { canvasFont, theme } from './northpole/theme';
import { seasonHeadline, type SeasonLine } from './season';

const { colors } = theme;

/** The card's own units: drawn at `SCALE` times this, so its PNG is 1200 by 630. */
export const CARD = { width: 600, height: 315 };
export const SCALE = 2;

/** The booth's own drawing, `size` across from the origin. */
type BoothDrawing = (ctx: CanvasRenderingContext2D, size: number) => void;

/** Lines of `text` that fit in `width`, broken at spaces. */
export function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The booth as it is now, `size` across, in a cream frame at the card's top left. */
function drawFramedBooth(ctx: CanvasRenderingContext2D, size: number, booth: BoothDrawing) {
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.roundRect(20, 20, size + 16, size + 16, theme.radius);
  ctx.fill();
  ctx.save();
  ctx.translate(28, 28);
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, theme.radius / 2);
  ctx.clip();
  booth(ctx, size);
  ctx.restore();
}

/** Who the card is for, above their booth's name, from `left`, no wider than `room`. */
function drawWho(
  ctx: CanvasRenderingContext2D,
  at: { left: number; room: number },
  login: string,
  boothName: string,
  lines: readonly SeasonLine[],
) {
  const { left, room } = at;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colors.gold;
  ctx.font = canvasFont('small', 'bold');
  ctx.fillText('NORTH POLE CARNIVAL', left, 50, room);
  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('title', 'bold');
  ctx.fillText(`@${login}`, left, 88, room);
  ctx.fillStyle = colors.muted;
  ctx.font = canvasFont('small');
  ctx.fillText(seasonHeadline(lines), left, 110, room);
  ctx.fillStyle = colors.glow;
  ctx.font = canvasFont('body', 'bold');
  ctx.fillText(boothName, left, 136, room);
}

/** The numbers that apply, one a line, or a welcome when there are none yet. */
function drawSeason(
  ctx: CanvasRenderingContext2D,
  at: { left: number; room: number },
  lines: readonly SeasonLine[],
) {
  const { left, room } = at;
  const top = 172;
  if (lines.length > 0) {
    const step = Math.min(28, (CARD.height - 30 - top) / lines.length);
    lines.forEach((line, i) => {
      const y = top + i * step;
      ctx.fillStyle = colors.gold;
      ctx.font = canvasFont('body', 'bold');
      ctx.fillText(String(line.value), left, y, 36);
      ctx.fillStyle = colors.text;
      ctx.font = canvasFont('small');
      ctx.fillText(line.label, left + 32, y, room - 32);
    });
  } else {
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('small');
    const welcome = `A booth of my own on the North Pole map, described in one issue and built by an agent. The first of many.`;
    wrap(ctx, welcome, room).forEach((line, i) => {
      ctx.fillText(line, left, top + i * 20, room);
    });
  }
}

/**
 * Paints the season card in the card's own units: the dusk sky, the booth as
 * it is now in a cream frame on the left, and on the right who it belongs to
 * and the numbers that apply, or a welcome when there are none yet.
 */
export function drawCard(
  ctx: CanvasRenderingContext2D,
  login: string,
  boothName: string,
  booth: BoothDrawing,
  lines: readonly SeasonLine[],
) {
  const { width, height } = CARD;
  ctx.save();
  ctx.scale(width / 100, height / 100);
  backdrop(ctx);
  ctx.restore();
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  const size = height - 56;
  drawFramedBooth(ctx, size, booth);
  const left = size + 60;
  const at = { left, room: width - left - 20 };
  drawWho(ctx, at, login, boothName, lines);
  drawSeason(ctx, at, lines);

  ctx.fillStyle = colors.muted;
  ctx.font = canvasFont('small');
  ctx.textAlign = 'right';
  ctx.fillText('Built with Tessl', width - 20, height - 16);
}
