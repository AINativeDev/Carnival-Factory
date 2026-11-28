/**
 * The studio's slim header, one row over the scene: the ON AIR sign on the
 * left (PLAYBACK as the take plays back), the signal that misses drain in the
 * middle, and the score on the right, each with its micro label on one line
 * and its value on the next, so the three line up.
 */
import { theme } from '../../../src/northpole/theme';
import type { Game } from './game';
import { HEADER, MARGIN } from './layout';
import { caps, letter, rounded, TYPE } from './lettering';
import { grouped } from './score';

const { colors } = theme;

/** The sign's box. */
const SIGN = { x: MARGIN, w: 26 } as const;
/** The signal meter's box. */
const METER = { x: 35, w: 25, h: 3 } as const;

/** A sign's face: lit `lit` from 0 to 1, a lamp on its left and its words beside it. */
function face(ctx: CanvasRenderingContext2D, text: string, colour: string, lit: number) {
  const h = HEADER.bottom - HEADER.top;
  ctx.fillStyle = colors.shadow;
  rounded(ctx, SIGN.x, HEADER.top + 0.6, SIGN.w, h, 2.2);
  ctx.fill();
  ctx.fillStyle = colour;
  ctx.globalAlpha = 0.45 + lit * 0.55;
  rounded(ctx, SIGN.x, HEADER.top, SIGN.w, h, 2.2);
  ctx.fill();
  const mid = HEADER.top + h / 2;
  ctx.fillStyle = colors.snowLit;
  ctx.globalAlpha = 0.5 + lit * 0.5;
  ctx.beginPath();
  ctx.arc(SIGN.x + 4.2, mid, 1.2, 0, Math.PI * 2);
  ctx.fill();
  letter(ctx, text, {
    x: SIGN.x + 7.2,
    y: mid + 0.2,
    height: TYPE.lead,
    colour: colors.snowLit,
    align: 'left',
  });
  ctx.globalAlpha = 1;
}

/** The sign: ON AIR while it records, brighter the stronger the signal, crossing to PLAYBACK. */
export function signs(ctx: CanvasRenderingContext2D, game: Game, listen: number) {
  const onAir = game.ended === null ? 0.4 + game.signal * 0.6 : 0.2;
  face(ctx, 'ON AIR', colors.berry, onAir);
  if (listen <= 0) return;
  ctx.save();
  ctx.globalAlpha = listen;
  face(ctx, 'PLAYBACK', colors.pine, 1);
  ctx.restore();
}

/** The signal: its label, and a bar that's full and green, or nearly gone and red. */
export function signal(ctx: CanvasRenderingContext2D, game: Game) {
  const label = { x: METER.x, y: HEADER.label, height: TYPE.micro, colour: colors.muted };
  caps(ctx, 'SIGNAL', label);
  const y = HEADER.value - METER.h / 2;
  ctx.fillStyle = colors.surface;
  rounded(ctx, METER.x, y, METER.w, METER.h, METER.h / 2);
  ctx.fill();
  const strength = game.signal;
  if (strength <= 0) return;
  ctx.fillStyle = strength > 0.5 ? colors.mint : strength > 0.25 ? colors.gold : colors.berry;
  rounded(ctx, METER.x, y, Math.max(METER.h, METER.w * strength), METER.h, METER.h / 2);
  ctx.fill();
}

/** The score on the right: whose episode and the best of the visit over it, the points as the hero. */
export function scoreboard(ctx: CanvasRenderingContext2D, game: Game, best: number) {
  const right = 100 - MARGIN;
  const who = game.visitor ? `EPISODE ${String(game.episode)}` : 'HOST’S DEMO';
  const label = `${who} · BEST ${grouped(best)}`;
  caps(ctx, label, {
    x: right,
    y: HEADER.label,
    height: TYPE.micro,
    colour: colors.muted,
    align: 'right',
  });
  const score = { x: right, y: HEADER.value + 0.4, height: TYPE.title, colour: colors.gold };
  letter(ctx, grouped(game.score), { ...score, align: 'right' });
}
