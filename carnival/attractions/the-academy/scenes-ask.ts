/**
 * The first screens: the entrance, the ticket waiting on its podium with
 * twinkles round it (all the map ever sees); writing the ticket, by picking
 * a booth and then a look on three cards; and the ticket popping into life
 * on the writing desk, labelled booth-request. The ticket itself is drawn
 * by traveller.ts.
 */
import { theme } from '../../../src/northpole/theme';
import { burst } from './juice';
import { letters, popIn, rounded, scatter, star, TYPE, wrap } from './kit';
import { boothIcon } from './icons';
import { type Box, CHOICES, inside } from './layout';
import type { Moment } from './moment';
import { BOOTHS, LOOKS } from './steps';

const { colors } = theme;

/** A few gold twinkles round a point, each fading in and out slowly. */
function twinkles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  reach: number,
  time: number,
) {
  for (let n = 0; n < 6; n++) {
    const a = scatter(n) * Math.PI * 2;
    const r = reach * (0.7 + scatter(n + 9) * 0.3);
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time / 900 + n * 1.7);
    star(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.55, 1.2 + scatter(n + 3));
  }
  ctx.globalAlpha = 1;
}

/** The entrance: twinkles round the ticket on its podium. */
export function startScene(ctx: CanvasRenderingContext2D, moment: Moment) {
  twinkles(ctx, 50, 49, 28, moment.time);
}

/** The ticket popping into life on the desk, with a burst of stars. */
export function bornScene(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { since, time } = moment;
  twinkles(ctx, 52, 44, 24, time);
  burst(ctx, 52, 44, since - 80, { count: 10, reach: 20, colours: [], stars: true, seed: 5 });
}

/** One choice card's face: its picture, and its name in up to two lines. */
function face(ctx: CanvasRenderingContext2D, moment: Moment, box: Box, n: number, looks: boolean) {
  const cx = box.x + box.w / 2;
  boothIcon(ctx, looks ? moment.visit.booth : n, looks ? n : -1, cx, box.y + 14, 17, moment.time);
  ctx.fillStyle = colors.night;
  letters(ctx, TYPE.lead);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const name = (looks ? LOOKS.at(n) : BOOTHS.at(n)) ?? '';
  const lines = wrap(name, box.w - 4, (line) => ctx.measureText(line).width);
  const top = box.y + box.h - (lines.length > 1 ? 9.5 : 6.5);
  lines.forEach((line, k) => {
    ctx.fillText(line, cx, top + k * 4.4);
  });
}

/**
 * The three cards to pick the booth, or the look, from, popping in one
 * after another once the camera has arrived; the one under the pointer
 * lifts and glows.
 */
export function choiceCards(ctx: CanvasRenderingContext2D, moment: Moment, looks: boolean) {
  const { pointer, since } = moment;
  CHOICES.forEach((box, n) => {
    const grow = popIn((since - (looks ? 0 : 450) - n * 90) / 350);
    if (grow <= 0) return;
    const hover = pointer !== undefined && inside(box, pointer.x, pointer.y);
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    ctx.save();
    ctx.translate(cx, cy - (hover ? 1.2 : 0));
    ctx.scale(grow, grow);
    ctx.translate(-cx, -cy);
    if (hover) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = colors.glow;
      rounded(ctx, box.x - 1, box.y - 1, box.w + 2, box.h + 2, 3.2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = colors.shadow;
    rounded(ctx, box.x, box.y + 0.6, box.w, box.h, 2.2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.snowLit;
    rounded(ctx, box.x, box.y, box.w, box.h, 2.2);
    ctx.fill();
    face(ctx, moment, box, n, looks);
    ctx.restore();
  });
}
