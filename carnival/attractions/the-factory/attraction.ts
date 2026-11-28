import type { NorthPoleSquare } from '../../../src/northpole/square';
import { iso, pine, scene, shadow } from '../../../src/northpole/diorama';
import { flyingGifts, pops, sleigh } from './effects';
import { endCard } from './end-card';
import type { Game } from './game';
import { cards, scoreboard } from './hud';
import { advanceShow, type Ask, type Show } from './show';
import { arches, needBubble } from './stations';
import { tour } from './tour';
import { tower, TOWER } from './tower';
import { belt, hopper, parcel, parcelBehind } from './track';

/** The one show the attraction keeps for the visit. */
let show: Show | undefined;

/** What a tap asked of the page, until `ask` has passed it on. */
let asked: Ask | undefined;

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

/** The game, Feed the Loop, as it stands: its world, and what it shows over it. */
function game(ctx: CanvasRenderingContext2D, state: Game, time: number) {
  world(ctx, state, time);
  needBubble(ctx, state);
  pops(ctx, state, time);
  cards(ctx, state, time);
  scoreboard(ctx, state, time);
}

/**
 * The Factory: what a software factory is, then a game of it. A short tour,
 * tapped through or skipped, shows why a factory, what skills and loops are
 * (this repository's own), and how loops chain into a factory with gates
 * between them. Then Feed the Loop: a parcel rides the build loop round the
 * TESSL tower, and each station asks for a skill; tap the right card in time
 * to ship booths before three jams end the round. The end card offers Ask for
 * a booth, then Learn how in the Academy and Sign up for Tessl, and a quiet
 * line to keep in touch; a tap on one asks the page, through `ask`, to open
 * that link or visit the Academy. The tour waits for a tap, or the keys: →,
 * Enter or Space on, ← back.
 * On the map it stands as its tower.
 */
const theFactory: NorthPoleSquare = {
  id: 'the-factory',
  name: 'The Factory',
  description:
    'A short tour of how a software factory works, with skills, loops and gates, then feed its build loop yourself.',
  stall: { shape: 'shed', roof: 'gold', trim: 'cocoa', landmark: 'tower', letters: 'TESSL' },
  draw(ctx, size, time, pointer, keys) {
    const state = advanceShow(show, time, pointer, size, keys);
    show = state;
    if (state.ask) asked = state.ask;
    scene(ctx, size, time, () => {
      // The end card stands on the bare slab: the game's tower would poke out over it.
      if (state.phase === 'tour') tour(ctx, state, time);
      else if (state.phase === 'game') game(ctx, state.game, time);
      else endCard(ctx, state, time);
    });
  },
  ask() {
    const answer = asked;
    asked = undefined;
    return answer;
  },
};

export default theFactory;
