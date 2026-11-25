/**
 * The Elves' Card Table: Snap at a lantern-lit table. This file only joins the
 * parts together for the map: the visitor's game in visitor-game.ts, what the
 * table shows in table-view.ts, and the scene in table-scene.ts.
 */
import type { NorthPoleSquare } from '../../../src/northpole/square';
import { scene } from '../../../src/northpole/diorama';
import { gameView, idleView } from './table-view';
import { paint } from './table-scene';
import { play } from './visitor-game';
import type { Game } from './visitor-game';

/** The visitor's game, kept in memory for this visit only: null while the elves play each other. */
let game: Game | null = null;

const booth: NorthPoleSquare = {
  id: 'fernandezbaptiste',
  name: "Elves' Card Table",
  description:
    'Play Snap against an elf at a lantern-lit table: flip cards in turn, and tap the pile first when two match.',
  draw(ctx, size, time, pointer) {
    game = play(game, time, pointer?.presses ?? 0);
    const view = game ? gameView(game, time) : idleView(time, pointer !== undefined);
    scene(ctx, size, time, (c, t) => {
      paint(c, t, view);
    });
  },
};

export default booth;
