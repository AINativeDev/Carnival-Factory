/**
 * The name boards over the map's squares: the name, whose it is, and for a
 * booth its owner's portrait and colour. A stall, a pavilion and a tower all
 * wear one, so the board stands on its own.
 */
import { band, faceText, onFace, type Face } from './faces';
import { portrait } from './people';
import { canvasFont, theme } from './theme';

const { colors } = theme;

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
 * A name board along a face: the name, and whose it is under it, or the name
 * alone when `by` is empty. A booth's board has its owner's portrait at the
 * left and a trim in their colour.
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
) {
  const width = Math.abs(face.b.x - face.a.x);
  ctx.fillStyle = colors.cocoa;
  band(ctx, face, 0.04, 0.96, low, high, outward);
  ctx.fill();
  if (owner) {
    ctx.fillStyle = owner.color;
    band(ctx, face, 0.055, 0.945, low + 1, high - 1, outward);
    ctx.fill();
  }
  ctx.fillStyle = colors.cream;
  band(ctx, face, 0.07, 0.93, low + 2.5, high - 2.5, outward);
  ctx.fill();
  const line = (high - low) / 2;
  // With a portrait, the words move right of it.
  const r = Math.min(line - 3.5, width * 0.09);
  const pictured = owner?.by === undefined && owner && r > 2;
  const along = pictured ? 0.58 : 0.5;
  const room = pictured ? width * 0.62 : width * 0.8;
  if (pictured) {
    const at = onFace(face, 0.08 + r / width + 0.02, low + line, outward);
    const slope = (face.b.y - face.a.y) / (face.b.x - face.a.x);
    ctx.save();
    ctx.transform(1, slope, 0, 1, at.x, at.y);
    portrait(ctx, r, owner.avatar);
    ctx.restore();
  }
  faceText(
    ctx,
    face,
    name,
    along,
    by ? high - line * 0.62 : low + line,
    room,
    canvasFont('small', 'bold'),
    colors.ink,
    outward,
  );
  if (!by) return;
  faceText(
    ctx,
    face,
    by,
    along,
    low + line * 0.5,
    room,
    canvasFont('small'),
    colors.berry,
    outward,
  );
}
