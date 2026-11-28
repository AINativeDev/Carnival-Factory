/**
 * The slim header over the hall's wall: an eyebrow saying where the ticket
 * is ("Station 4 of 7 · Check") with a short gold bar under it, seven pips
 * for the stations on the right, the step's title, its lead line and, on
 * some beats, one quiet aside. New words ease in. On the "you're on the map"
 * card a quiet link in the corner goes on to your own repo.
 */
import { theme } from '../../../src/northpole/theme';
import { kindOf } from './journey';
import { easeIn, eyebrow, letters, TYPE } from './kit';
import { inside, LIVE_NEXT, MARGIN } from './layout';
import type { Moment } from './moment';
import { beatOf, STATIONS, STEPS, withBooth } from './steps';
import { link } from './ui';

const { colors } = theme;

/** The eyebrow over step `step`'s title: which station it is, or where the journey stands. */
export function eyebrowFor(step: number): string {
  const at = STEPS.at(step);
  if (!at || at.kind === 'start') return '7 stations, 1 ticket';
  if (at.kind === 'repo') return 'After the map';
  return `Station ${String(at.station)} of 7 · ${STATIONS.at(at.station - 1) ?? ''}`;
}

/** The seven stations as pips on the right: passed ones mint, the one up gold. */
function pips(ctx: CanvasRenderingContext2D, station: number) {
  STATIONS.forEach((_, n) => {
    const at = n + 1;
    const x = 96 - (STATIONS.length - at) * 3.4 - 1;
    ctx.globalAlpha = at > station ? 0.3 : 1;
    ctx.fillStyle = at < station ? colors.mint : at === station ? colors.gold : colors.snow;
    ctx.beginPath();
    ctx.arc(x, 5.6, at === station ? 1.2 : 0.85, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/** The header as the moment stands. */
export function header(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { visit, since, pointer } = moment;
  const step = STEPS.at(visit.step);
  const beat = beatOf(visit.step, visit.beat);
  // A new step's title eases in; a new beat of the same step only changes its lines.
  const titled = visit.beat === 0 && visit.from !== visit.step ? easeIn(since) : easeIn(1_000);
  ctx.globalAlpha = titled.alpha;
  ctx.fillStyle = colors.muted;
  eyebrow(ctx, eyebrowFor(visit.step), MARGIN, 5.6);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(MARGIN, 7.7, 7, 0.5);
  if (step && step.station > 0) pips(ctx, step.station);
  ctx.globalAlpha = titled.alpha;
  ctx.fillStyle = colors.snowLit;
  letters(ctx, TYPE.title);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(step?.title ?? '', MARGIN, 12.8 + titled.rise, 92);
  const lead = easeIn(since - 80);
  ctx.globalAlpha = lead.alpha;
  ctx.fillStyle = colors.snow;
  letters(ctx, TYPE.lead, false);
  ctx.fillText(withBooth(beat.line, visit.booth), MARGIN, 18.6 + lead.rise, 92);
  if (beat.aside) {
    const aside = easeIn(since - 450);
    ctx.globalAlpha = aside.alpha;
    ctx.fillStyle = colors.muted;
    letters(ctx, TYPE.body, false);
    ctx.fillText(beat.aside, MARGIN, 22.6 + aside.rise, 92);
  }
  ctx.globalAlpha = 1;
  if (kindOf(visit) !== 'live') return;
  const hover = pointer !== undefined && inside(LIVE_NEXT, pointer.x, pointer.y);
  link(ctx, LIVE_NEXT, beat.button, false, hover, 'right');
}
