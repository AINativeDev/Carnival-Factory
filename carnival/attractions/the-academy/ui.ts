/**
 * The Academy's surfaces and buttons, in the one look the Tessl places
 * share: night panels with rounded corners and a soft shadow and no outline;
 * one gold primary a screen that breathes gently; snow-lit secondaries; and
 * quiet underlined links. A button lifts a little under the pointer and can
 * pop in with `grow`.
 */
import { theme } from '../../../src/northpole/theme';
import { letters, rounded, TYPE } from './kit';
import type { Box } from './layout';

const { colors } = theme;

/** Every surface's corner radius. */
const RADIUS = 2.2;

/** The soft shadow under a surface: `shadow`, a little below it. */
function underShadow(ctx: CanvasRenderingContext2D, box: Box, alpha: number) {
  ctx.globalAlpha = alpha * 0.45;
  ctx.fillStyle = colors.shadow;
  rounded(ctx, box.x, box.y + 0.6, box.w, box.h, RADIUS);
  ctx.fill();
}

/** A night panel at about 0.85, rounded, with its soft shadow. */
export function surface(ctx: CanvasRenderingContext2D, box: Box, alpha = 1) {
  underShadow(ctx, box, alpha);
  ctx.globalAlpha = alpha * 0.85;
  ctx.fillStyle = colors.night;
  rounded(ctx, box.x, box.y, box.w, box.h, RADIUS);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** How a button stands: the one gold primary, or a snow-lit secondary. */
export type Rank = 'primary' | 'secondary';

/** How a button is drawn this frame: under the pointer, how far it has popped in, and the clock. */
export interface ButtonState {
  hover: boolean;
  grow: number;
  time: number;
}

/**
 * A button: the gold primary breathes with a soft glow on a 2 s loop, a
 * secondary sits quiet in snow. Its label is squeezed to fit, never shrunk
 * below its size on the scale.
 */
export function button(
  ctx: CanvasRenderingContext2D,
  box: Box,
  label: string,
  rank: Rank,
  state: ButtonState,
) {
  const { hover, grow, time } = state;
  if (grow <= 0) return;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  ctx.save();
  ctx.translate(cx, cy - (hover ? 0.6 : 0));
  ctx.scale(grow, grow);
  ctx.translate(-cx, -cy);
  const primary = rank === 'primary';
  if (primary) {
    // A warm halo that swells and settles on a 2 s loop, in soft layers rather than an outline.
    const breath = 0.5 + 0.5 * Math.sin((time / 2_000) * Math.PI * 2);
    ctx.fillStyle = colors.gold;
    for (const spread of [0.6, 1.3, 2.1]) {
      ctx.globalAlpha = 0.05 + 0.07 * breath;
      const out = spread * (0.7 + 0.3 * breath);
      rounded(ctx, box.x - out, box.y - out, box.w + out * 2, box.h + out * 2, RADIUS + out);
      ctx.fill();
    }
  }
  underShadow(ctx, box, 1);
  ctx.globalAlpha = primary ? 1 : 0.92;
  ctx.fillStyle = primary ? (hover ? colors.glow : colors.gold) : colors.snowLit;
  rounded(ctx, box.x, box.y, box.w, box.h, RADIUS);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.night;
  letters(ctx, primary ? TYPE.lead : TYPE.body);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy + 0.2, box.w - 3);
  ctx.restore();
}

/**
 * A quiet link: underlined words at body size, gold for a link that leaves
 * the page and snow for one that stays, brighter under the pointer. `align`
 * says which edge of `box` the words keep to, and `alpha` fades it in.
 */
export function link(
  ctx: CanvasRenderingContext2D,
  box: Box,
  label: string,
  out: boolean,
  hover: boolean,
  align: CanvasTextAlign = 'center',
  alpha = 1,
) {
  ctx.fillStyle = out ? colors.gold : colors.snowLit;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.globalAlpha = alpha * (hover ? 1 : 0.86);
  letters(ctx, TYPE.body, hover);
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const y = box.y + box.h / 2;
  const x = align === 'left' ? box.x : align === 'right' ? box.x + box.w : box.x + box.w / 2;
  ctx.fillText(label, x, y);
  const width = Math.min(ctx.measureText(label).width, box.w);
  const from = align === 'left' ? x : align === 'right' ? x - width : x - width / 2;
  ctx.lineWidth = 0.22;
  ctx.beginPath();
  ctx.moveTo(from, y + 2);
  ctx.lineTo(from + width, y + 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}
