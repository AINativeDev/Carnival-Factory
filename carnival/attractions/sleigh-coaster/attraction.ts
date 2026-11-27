/**
 * The Sleigh-Ride Coaster, played as Boost & Brake: hold to push Santa's
 * sleigh along the candy-cane rail, let go to coast, get over every hill
 * without flying off the rails at a crest, and catch the presents floating
 * over them before the clock runs out. Puts the scrolling hill, the presents,
 * the sleigh, the gauge and the cards together, back to front, and keeps the
 * attraction's one memory of the visit.
 */
import type { NorthPoleSquare } from '../../../src/northpole/square';
import { scene } from '../../../src/northpole/diorama';
import { drawCard } from './card';
import { advance, type Coaster, newCoaster } from './game';
import { drawGauge } from './gauge';
import { drawBanner, drawChips, drawHint, drawPresents } from './hud';
import { crestReading } from './physics';
import { driftOf, poseOf, tumbled } from './pose';
import { camOf, drawScenery } from './scenery';
import { drawDrift, drawPuffs, drawSleigh } from './sleigh';

/** The ride, the run and the best of the visit. */
let coaster: Coaster | undefined;

/** A sleigh-ride roller coaster game over a long, snowy, ever steeper hill. */
const attraction: NorthPoleSquare = {
  id: 'sleigh-coaster',
  name: 'Sleigh-Ride Coaster',
  description:
    'Boost & Brake: hold to push the sleigh over the hills, let go before a crest or fly off the rails, and catch the presents in the air.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'shed', roof: 'berry', trim: 'gold', landmark: 'coaster' },
  draw(ctx, size, time, pointer) {
    const state = advance(coaster ?? newCoaster(time), time, pointer);
    coaster = state;
    scene(ctx, size, time, () => {
      const cam = camOf(state.sleigh.x);
      drawScenery(ctx, cam, state.phase === 'demo' && state.sleigh.x < 1);
      drawPresents(ctx, state, cam, time);
      const pose = poseOf(state, cam, time);
      if (state.pushing && !state.sleigh.air) drawPuffs(ctx, pose, time);
      drawSleigh(ctx, pose);
      // In front of the sleigh, so it lands half buried in the snow.
      if (state.sleigh.off) drawDrift(ctx, driftOf(state, cam), tumbled(state, time));
      if (state.phase === 'demo') drawBanner(ctx, state.best, time);
      else drawChips(ctx, state, time);
      drawGauge(ctx, crestReading(state.sleigh));
      drawHint(ctx, state, pose, time);
      drawCard(ctx, state, time);
    });
  },
};

export default attraction;
