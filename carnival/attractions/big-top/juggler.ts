/**
 * The cast of the act, in scene units: the juggling elf in the middle of the
 * ring, who watches the baubles and flicks a hand up on each catch; the ringside elf
 * elf at the ringside who throws new baubles in; and the baubles themselves,
 * with their shadows on the sawdust and a ring round each one that's ready to catch.
 */
import { shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { RINGSIDE_ELF, type Act } from './act';
import { baubleAt, CATCHABLE, DROPPED, flight, HANDS } from './throws';

const { colors } = theme;

/** Each bauble's colour, by its place in the act. */
const BAUBLES = [colors.berry, colors.gold, colors.aurora, colors.violet, colors.mint];

/** How an elf looks: where their eyes turn, from -1 to 1, and whether they're aghast at a drop. */
interface Pose {
  look: number;
  aghast: boolean;
}

/** An elf's head with its pointed hat, eyes turned `look` (-1 to 1) and a smile, or an O when aghast. */
function head(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, pose: Pose) {
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x, y, 4 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.moveTo(x - 4.6 * u, y - 2 * u);
  ctx.lineTo(x + 4.6 * u, y - 2 * u);
  ctx.lineTo(x + 6 * u, y - 12 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 4.8 * u, y - 3 * u, 9.6 * u, 1.6 * u);
  ctx.beginPath();
  ctx.arc(x + 6 * u, y - 12 * u, 1.5 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + (side * 1.6 + pose.look * 0.6) * u, y - 0.2 * u, 0.6 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.5 * u;
  ctx.beginPath();
  if (pose.aghast) ctx.arc(x, y + 2 * u, 0.9 * u, 0, Math.PI * 2);
  else ctx.arc(x, y + 1.2 * u, 1.5 * u, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

/** An elf's body from its feet at (x, y): striped legs, a tunic with a gold belt. */
function body(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, tunic: string) {
  for (const side of [-1, 1]) {
    ctx.fillStyle = colors.snow;
    ctx.fillRect(x + side * 1.8 * u - 0.8 * u, y - 5 * u, 1.6 * u, 5 * u);
    ctx.fillStyle = colors.berry;
    ctx.fillRect(x + side * 1.8 * u - 0.8 * u, y - 3.5 * u, 1.6 * u, 1.2 * u);
  }
  ctx.fillStyle = tunic;
  ctx.beginPath();
  ctx.moveTo(x - 4.5 * u, y - 4.5 * u);
  ctx.lineTo(x + 4.5 * u, y - 4.5 * u);
  ctx.lineTo(x + 2.6 * u, y - 13 * u);
  ctx.lineTo(x - 2.6 * u, y - 13 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 3.6 * u, y - 8 * u, 7.2 * u, 1.2 * u);
}

/** The juggling elf in the middle of the ring, its hands at the act's catching line. */
export function juggler(ctx: CanvasRenderingContext2D, act: Act, time: number) {
  const feet = HANDS.y + 13;
  shadow(ctx, HANDS.x, feet, 12);
  body(ctx, HANDS.x, feet, 1, colors.berry);
  const urgent = act.balls.reduce((a, b) => (flight(b, time) > flight(a, time) ? b : a));
  const look = Math.max(-1, Math.min(1, (baubleAt(urgent, time).x - HANDS.x) / 8));
  const since = act.pop && act.pop.points > 0 ? time - act.pop.at : Infinity;
  const flicked = since < 220 ? 1 - since / 220 : 0;
  const leftHand = act.pop !== null && act.pop.x < HANDS.x;
  const flick = { left: leftHand ? flicked : 0, right: leftHand ? 0 : flicked };
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const [side, up] of [
    [-1, flick.left],
    [1, flick.right],
  ] as const) {
    const hand = { x: HANDS.x + side * HANDS.spread, y: HANDS.y - up * 4 };
    ctx.beginPath();
    ctx.moveTo(HANDS.x + side * 2.5, feet - 11.5);
    ctx.lineTo(hand.x, hand.y);
    ctx.stroke();
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  head(ctx, HANDS.x, feet - 17, 1, { look, aghast: act.dropped !== null });
}

/** The ringside elf at the ringside, arm up for a moment as they throw a new bauble in. */
export function ringsideElf(ctx: CanvasRenderingContext2D, act: Act, time: number) {
  const feet = RINGSIDE_ELF.y + 12;
  const since = time - act.joined;
  const up = since >= 0 && since < 600 ? Math.sin((since / 600) * Math.PI) : 0;
  shadow(ctx, RINGSIDE_ELF.x, feet, 8);
  body(ctx, RINGSIDE_ELF.x, feet, 0.7, colors.pine);
  ctx.strokeStyle = colors.pine;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(RINGSIDE_ELF.x + 1.5, feet - 8.5);
  ctx.lineTo(RINGSIDE_ELF.x + 4 + up, feet - 10 - up * 5);
  ctx.stroke();
  head(ctx, RINGSIDE_ELF.x, feet - 12, 0.7, { look: 1, aghast: act.dropped !== null });
}

/** Every bauble: its shadow on the sawdust, a ring round it while it can be caught, and the bauble. */
export function baubles(ctx: CanvasRenderingContext2D, act: Act, time: number) {
  act.balls.forEach((toss, n) => {
    const p = baubleAt(toss, time);
    const s = flight(toss, time);
    const height = Math.max(0, HANDS.floor - p.y);
    ctx.fillStyle = colors.shadow;
    ctx.globalAlpha = 0.25 * Math.max(0.2, 1 - height / 50);
    ctx.beginPath();
    ctx.ellipse(p.x, HANDS.floor + 1, 2.6, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    if (act.visitor && act.dropped === null && s >= CATCHABLE && s < DROPPED) {
      ctx.strokeStyle = s > 1 ? colors.berry : colors.glow;
      ctx.globalAlpha = 0.55 + 0.45 * Math.min(1, (s - CATCHABLE) * 2);
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    bauble(ctx, p.x, p.y, BAUBLES.at(n % BAUBLES.length) ?? colors.berry);
  });
}

/** A glass bauble at (x, y): its colour, a gold cap and a bright glint on its lit side. */
function bauble(ctx: CanvasRenderingContext2D, x: number, y: number, colour: string) {
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 1, y - 4, 2, 1.4);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(x - 1, y - 1, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
