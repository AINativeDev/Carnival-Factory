/**
 * Station 6, the auto-merge gate, in its bay of the hall: seven lamps hang
 * from the gate's lintel and a board beside it names each check. One lamp
 * lights a tap, with a pop and a soft ring; with all seven lit the doors
 * swing open in a gentle burst and a little shake, and the ticket hops in
 * the doorway (traveller.ts). The map and your repo are in scenes-live.ts.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { GATE } from './bays';
import { burst, ring, shake } from './juice';
import { easeIn, letters, popIn, smooth, TYPE } from './kit';
import type { Moment } from './moment';
import { GATE_CHECKS } from './steps';
import { surface } from './ui';

const { colors } = theme;

/** Where lamp `n` hangs under the lintel. */
const lampAt = (n: number) => ({ x: GATE.left + 3 + n * 5, y: GATE.top + 4.2 });

/** The gate's two doors, closed, or swinging open by `open` (0 to 1) on the warm light behind. */
function doors(ctx: CanvasRenderingContext2D, open: number) {
  const left = GATE.left + 4.5;
  const width = GATE.right - GATE.left - 6;
  const top = GATE.top + 2.6;
  const bottom = 69.5;
  if (open > 0) {
    ctx.globalAlpha = open;
    ctx.fillStyle = colors.lantern;
    ctx.fillRect(left, top, width, bottom - top);
    ctx.globalAlpha = 1;
    glow(ctx, left + width / 2, 50, 20, open);
  }
  const half = (width / 2) * (1 - open * 0.82);
  for (const [x, w] of [
    [left, half],
    [left + width - half, half],
  ] as const) {
    ctx.fillStyle = colors.wood;
    ctx.fillRect(x, top, w, bottom - top);
    ctx.fillStyle = colors.cocoa;
    ctx.globalAlpha = 0.5;
    for (let p = x + 3; p < x + w - 0.5; p += 3.5) ctx.fillRect(p, top, 0.35, bottom - top);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = colors.gold;
  ctx.fillRect(left + half - 1.4, 50, 0.9, 3);
  ctx.fillRect(left + width - half + 0.5, 50, 0.9, 3);
}

/** The seven lamps under the lintel, lit up to `lit`; the newest one pops `since` ms after it lit. */
function lamps(ctx: CanvasRenderingContext2D, lit: number, since: number) {
  GATE_CHECKS.forEach((_, n) => {
    const { x, y } = lampAt(n);
    const on = n < lit;
    const newest = n === lit - 1;
    const r = 1.4 * (newest ? popIn(since / 260) * 0.6 + 0.4 : 1);
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 0.25;
    ctx.beginPath();
    ctx.moveTo(x, GATE.top + 2.2);
    ctx.lineTo(x, y - 1.4);
    ctx.stroke();
    if (on) glow(ctx, x, y, 5, 0.8);
    ctx.fillStyle = on ? colors.mint : colors.slabShade;
    ctx.beginPath();
    ctx.arc(x, y, on ? r : 1.4, 0, Math.PI * 2);
    ctx.fill();
    if (!newest) return;
    ring(ctx, x, y, since, 7, colors.mint);
    burst(ctx, x, y, since, { count: 6, reach: 6, colours: [colors.mint, colors.glow], seed: n });
  });
}

/** The board beside the gate: each check by its lamp, lit ones bright, the newest easing in. */
function names(ctx: CanvasRenderingContext2D, lit: number, since: number) {
  surface(ctx, { x: 52, y: 25.5, w: 44, h: 37 });
  letters(ctx, TYPE.body);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  GATE_CHECKS.forEach((check, n) => {
    const y = 30 + n * 4.9;
    const on = n < lit;
    const fresh = n === lit - 1 ? easeIn(since) : { alpha: 1, rise: 0 };
    ctx.fillStyle = on ? colors.mint : colors.slabShade;
    ctx.globalAlpha = on ? 1 : 0.6;
    ctx.beginPath();
    ctx.arc(56, y, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = on ? colors.snowLit : colors.muted;
    ctx.globalAlpha = on ? fresh.alpha : 0.75;
    ctx.fillText(check, 59 + fresh.rise, y + 0.2, 35);
  });
  ctx.globalAlpha = 1;
}

/** The gate: a lamp and a name for each check, lit up to the beat, and the doors swinging open after the last. */
export function gateScene(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { visit, since } = moment;
  const lit = Math.min(visit.beat, GATE_CHECKS.length);
  const through = visit.beat >= GATE_CHECKS.length;
  const jolt = through ? shake(since - 250, 0.7) : { x: 0, y: 0 };
  ctx.save();
  ctx.translate(jolt.x, jolt.y);
  doors(ctx, through ? smooth((since - 150) / 600) : 0);
  lamps(ctx, lit, through ? 1_000 : since);
  ctx.restore();
  if (through) {
    const mid = (GATE.left + GATE.right) / 2 + 1.5;
    burst(ctx, mid, 48, since - 250, { count: 14, reach: 18, colours: [], stars: true, seed: 11 });
  }
  names(ctx, lit, through ? 1_000 : since);
}
