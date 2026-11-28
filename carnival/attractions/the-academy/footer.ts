/**
 * The footer under the hall: Back (where there is one) and the one gold
 * button that says what the next tap does, a short hint naming the tap and
 * the key, and one quiet link out in the corner. On the "you're on the map"
 * card it holds the ways on instead: the gold hero, two secondaries side by
 * side and a quiet line of links to keep in touch, popping in once the card
 * has settled.
 */
import { theme } from '../../../src/northpole/theme';
import { kindOf } from './journey';
import { letters, popIn, smooth, TYPE } from './kit';
import { actionFor, BACK, type Box, hasBack, inside, MARGIN } from './layout';
import type { Moment } from './moment';
import { KEEP_IN_TOUCH, nudgesFor } from './nudges';
import type { Visit } from './state';
import { beatOf } from './steps';
import { button, link } from './ui';

const { colors } = theme;

/** The hint under the buttons: the tap and the key that go on, as short as it can be. */
export function hintFor(visit: Visit): string {
  switch (kindOf(visit)) {
    case 'start':
      return 'Tap or → to start';
    case 'booth':
    case 'look':
      return 'Tap a card, or → for a surprise';
    case 'checks':
      return visit.squashed.length < 3 ? 'Tap a bug, or → to squash one' : 'Tap or → to go on';
    case 'repo':
      return 'Tap or → to start over';
    default:
      return 'Tap or → to go on';
  }
}

/** Whether the pointer is over `box`. */
const over = (moment: Moment, box: Box) =>
  moment.pointer !== undefined && inside(box, moment.pointer.x, moment.pointer.y);

/** The ways on, on the "you're on the map" card, popping in one after another. */
function waysOn(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { since, time } = moment;
  const shown = smooth((since - 500) / 350);
  nudgesFor(true).forEach((nudge, n) => {
    const hover = over(moment, nudge.box);
    if (nudge.rank === 'link') {
      link(ctx, nudge.box, nudge.label, true, hover, 'center', shown);
      return;
    }
    const grow = popIn((since - 500 - n * 120) / 350);
    const rank = nudge.rank === 'hero' ? 'primary' : 'secondary';
    button(ctx, nudge.box, nudge.label, rank, { hover, grow, time });
  });
  ctx.globalAlpha = shown * 0.85;
  ctx.fillStyle = colors.snow;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  letters(ctx, TYPE.body, false);
  ctx.fillText('Keep in touch:', KEEP_IN_TOUCH.x, KEEP_IN_TOUCH.y);
  ctx.textAlign = 'center';
  ctx.fillText('·', 63, KEEP_IN_TOUCH.y);
  ctx.fillText('·', 76, KEEP_IN_TOUCH.y);
  ctx.globalAlpha = 1;
}

/** The footer as the moment stands. */
export function footer(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { visit, time } = moment;
  const kind = kindOf(visit);
  if (kind === 'live') {
    waysOn(ctx, moment);
    return;
  }
  if (hasBack(kind)) {
    button(ctx, BACK, '◀ Back', 'secondary', { hover: over(moment, BACK), grow: 1, time });
  }
  const action = actionFor(kind);
  const label = beatOf(visit.step, visit.beat).button;
  button(ctx, action, label, 'primary', { hover: over(moment, action), grow: 1, time });
  ctx.fillStyle = colors.muted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  letters(ctx, TYPE.body, false);
  ctx.fillText(hintFor(visit), MARGIN, 95.3);
  const quiet = nudgesFor(false).at(0);
  if (quiet) link(ctx, quiet.box, quiet.label, true, over(moment, quiet.box), 'right');
}
