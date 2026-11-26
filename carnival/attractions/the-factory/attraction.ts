import type { NorthPoleSquare } from '../../../src/northpole/square';
import { iso, pine, scene, shadow } from '../../../src/northpole/diorama';
import { advance, type Game, newGame } from './game';
import { cards, overCard, scoreboard } from './hud';
import { flyingGifts, pops, sleigh } from './effects';
import { arches, needBubble } from './stations';
import { tower, TOWER } from './tower';
import { belt, hopper, parcel, parcelBehind } from './track';

/** The one game the attraction keeps for the visit. */
let game: Game | undefined;

/** Whether the last frame's tap hit the sign-up button, until `ask` has passed it on. */
let wantsLink = false;

/** The game's world in depth order: the tower, the back of the loop, the hopper, then the front. */
function world(ctx: CanvasRenderingContext2D, state: Game, time: number) {
  const foot = iso(TOWER.gx + TOWER.w, TOWER.gy + TOWER.d);
  shadow(ctx, foot.x + 3, foot.y - 2, 22);
  for (const [gx, gy, h] of [
    [6, -20, 8],
    [14, -20, 10],
    [19, -14, 7],
  ] as const) {
    const at = iso(gx, gy);
    pine(ctx, at.x, at.y, h);
  }
  tower(ctx, state, time);
  belt(ctx, state);
  arches(ctx, state, true);
  const behind = parcelBehind(state);
  if (behind) parcel(ctx, state, time);
  hopper(ctx, state, time);
  if (!behind) parcel(ctx, state, time);
  arches(ctx, state, false);
  sleigh(ctx, state.shipped);
  flyingGifts(ctx, state, time);
}

/**
 * The Factory: Feed the Loop. A parcel rides the build loop round the TESSL
 * tower, and each station, request, build, review and merge, asks for a
 * skill; tap the right card in time to keep it moving and ship booths, faster
 * every level, until three jams end the round. Its sign-up button opens the
 * Factory's own link, through `ask`, and on the map it stands as its tower.
 */
const theFactory: NorthPoleSquare = {
  id: 'the-factory',
  name: 'The Factory',
  description:
    'Feed the build loop the skills each station asks for, ship booths and beat your best before the belt jams.',
  stall: { shape: 'shed', roof: 'gold', trim: 'cocoa', landmark: 'tower', letters: 'TESSL' },
  draw(ctx, size, time, pointer) {
    const state = advance(game ?? newGame(time), time, pointer, size);
    game = state;
    if (state.link) wantsLink = true;
    scene(ctx, size, time, () => {
      world(ctx, state, time);
      needBubble(ctx, state);
      pops(ctx, state, time);
      cards(ctx, state, time);
      scoreboard(ctx, state, time);
      overCard(ctx, state, time);
    });
  },
  ask() {
    if (!wantsLink) return undefined;
    wantsLink = false;
    // Link 0 is the Factory's first link out on its panel: Sign up for Tessl.
    return { open: 0 };
  },
};

export default theFactory;
