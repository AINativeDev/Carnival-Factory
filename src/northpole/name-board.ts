/**
 * The name boards over the map's squares: the name, whose it is, and for a
 * booth its owner's portrait and colour. A stall, a pavilion and a tower all
 * wear one, so the board stands on its own.
 */
import { band, faceText, onFace, type Face } from './faces';
import { portrait } from './people';
import { nameLines, SIGN_STYLES, type SignStyle } from './sign-styles';
import { signFont, theme } from './theme';

/**
 * Who owns a booth, as its stall shows it: their colour on the pennant and the
 * sign's trim, their avatar on the sign (undefined for the elf fallback), and
 * whether they are the visitor, whose own booth says "You".
 */
export interface Owner {
  color: string;
  avatar?: CanvasImageSource;
  you: boolean;
  /** What the sign says under the name in place of "by @id", for a stall nobody owns; such a stall wears no badges. */
  by?: string;
}

/**
 * A name board along a face, lettered in `style`: the name, on two lines when
 * it's long, and whose it is under it, or the name alone when `by` is empty. A
 * booth's board has its owner's portrait at the left and a trim in their colour.
 */
export function faceSign(
  ctx: CanvasRenderingContext2D,
  face: Face,
  low: number,
  high: number,
  name: string,
  by: string,
  outward = 0,
  owner?: Owner,
  style: SignStyle = SIGN_STYLES.stall,
) {
  const width = Math.abs(face.b.x - face.a.x);
  ctx.fillStyle = style.edge;
  band(ctx, face, 0.04, 0.96, low, high, outward);
  ctx.fill();
  if (owner) {
    ctx.fillStyle = owner.color;
    band(ctx, face, 0.055, 0.945, low + 1, high - 1, outward);
    ctx.fill();
  }
  ctx.fillStyle = style.board;
  band(ctx, face, 0.07, 0.93, low + 2.5, high - 2.5, outward);
  ctx.fill();
  // With a portrait, the words move right of it.
  const r = Math.min((high - low) / 2 - 3.5, width * 0.09);
  const pictured = owner?.by === undefined && owner && r > 2;
  const along = pictured ? 0.58 : 0.5;
  const room = pictured ? width * 0.62 : width * 0.8;
  if (pictured) {
    const at = onFace(face, 0.08 + r / width + 0.02, (low + high) / 2, outward);
    const slope = (face.b.y - face.a.y) / (face.b.x - face.a.x);
    ctx.save();
    ctx.transform(1, slope, 0, 1, at.x, at.y);
    portrait(ctx, r, owner.avatar);
    ctx.restore();
  }
  signWords(ctx, face, { low: low + 2.5, high: high - 2.5, along, room, outward }, name, by, style);
}

/** The smallest a sign's name is drawn, in world pixels, before it's shortened instead. */
const MIN_PX = 7;

/** Where a board's words go: between `low` and `high`, centred `along` it, `room` wide. */
interface WordsBox {
  low: number;
  high: number;
  along: number;
  room: number;
  outward: number;
}

/** The name's lines, larger, over the smaller line saying whose it is. */
function signWords(
  ctx: CanvasRenderingContext2D,
  face: Face,
  box: WordsBox,
  name: string,
  by: string,
  style: SignStyle,
) {
  const shown = style.caps ? name.toUpperCase() : name;
  const tall = box.high - box.low;
  const base = Math.min(theme.font.small, tall * (by ? 0.5 : 0.7));
  ctx.font = signFont(style.family, base, true, style.italic);
  const lines = nameLines(shown, box.room, (text) => ctx.measureText(text).width);
  // Rows from the top: each name line counts as one, the by line as two-thirds of one.
  const rows = lines.length + (by ? 0.66 : 0);
  const row = tall / rows;
  // Small enough that the widest line fits the board, down to a size that still reads; past that, faceText shortens it.
  const widest = Math.max(...lines.map((text) => ctx.measureText(text).width));
  const px = Math.max(MIN_PX, Math.min(base, row * 0.82, (base * box.room) / Math.max(1, widest)));
  lines.forEach((text, n) => {
    const lift = box.high - row * (n + 0.5);
    faceText(
      ctx,
      face,
      text,
      box.along,
      lift,
      box.room,
      signFont(style.family, px, true, style.italic),
      style.ink,
      box.outward,
    );
  });
  if (!by) return;
  const byPx = Math.min(theme.font.small * 0.8, row * 0.55);
  faceText(
    ctx,
    face,
    by,
    box.along,
    box.low + row * 0.33,
    box.room,
    signFont('sans', byPx, false),
    style.byInk,
    box.outward,
  );
}
