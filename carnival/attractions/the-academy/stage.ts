/**
 * The scene as the moment stands: the hall seen from where the camera is,
 * the station's people and what they do in their bay, the ticket on its
 * way, the cards or the card that sit over the scene on some steps, and the
 * soft dusk shading at the top and the foot that lets the header and the
 * footer read over it.
 */
import { theme } from '../../../src/northpole/theme';
import { bayOf, cameraAt } from './camera';
import { hall } from './hall';
import { kindOf } from './journey';
import { END_FOOTER, FOOTER } from './layout';
import type { Moment } from './moment';
import { bornScene, choiceCards, startScene } from './scenes-ask';
import { checksScene, reviewScene } from './scenes-check';
import { gateScene } from './scenes-end';
import { liveScene, repoCard } from './scenes-live';
import { assessScene, buildScene } from './scenes-make';
import { traveller } from './traveller';

const { colors } = theme;

/** The people of the step's bay and what they do, in the bay's own units. */
function actors(ctx: CanvasRenderingContext2D, moment: Moment) {
  switch (kindOf(moment.visit)) {
    case 'start': {
      startScene(ctx, moment);
      return;
    }
    case 'ticket': {
      bornScene(ctx, moment);
      return;
    }
    case 'assess': {
      assessScene(ctx, moment);
      return;
    }
    case 'build': {
      buildScene(ctx, moment);
      return;
    }
    case 'checks': {
      checksScene(ctx, moment);
      return;
    }
    case 'review': {
      reviewScene(ctx, moment);
      return;
    }
    case 'gate': {
      gateScene(ctx, moment);
      return;
    }
    case 'live': {
      liveScene(ctx, moment);
      return;
    }
    default:
  }
}

/** Dusk shading from `from` to `to`, `alpha` at its darkest end, so words read over the hall. */
function shade(ctx: CanvasRenderingContext2D, from: number, to: number, alpha: number) {
  // Soft bands of night rather than a gradient: the theme's colours carry no alpha of their own.
  // Each band reaches a little further from the dark edge, so they stack up darkest there.
  ctx.fillStyle = colors.night;
  const steps = 10;
  ctx.globalAlpha = 1 - (1 - alpha) ** (1 / steps);
  for (let n = 1; n <= steps; n++) {
    const reach = ((to - from) * n) / steps;
    ctx.fillRect(0, Math.min(from, from + reach), 100, Math.abs(reach));
  }
  ctx.globalAlpha = 1;
}

/** The scene: the hall, its people, the ticket, and what sits over them. */
export function stage(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { visit, since } = moment;
  const kind = kindOf(visit);
  const camera = cameraAt(visit, since);
  hall(ctx, camera);
  ctx.save();
  ctx.translate(bayOf(kind) * 100 - camera, 0);
  actors(ctx, moment);
  ctx.restore();
  traveller(ctx, moment);
  shade(ctx, 0, 27, 0.75);
  const foot = kind === 'live' ? END_FOOTER : FOOTER;
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = colors.night;
  ctx.fillRect(0, foot + 6, 100, 100 - foot - 6);
  ctx.globalAlpha = 1;
  shade(ctx, foot + 6, foot - 6, 0.9);
  if (kind === 'booth' || kind === 'look') choiceCards(ctx, moment, kind === 'look');
  if (kind === 'repo') repoCard(ctx, moment);
}
