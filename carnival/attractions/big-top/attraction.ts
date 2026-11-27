import type { NorthPoleSquare } from '../../../src/northpole/square';
import { scene } from '../../../src/northpole/diorama';
import { advance, newRing, type Ring } from './act';
import { card, hint, pop, scoreboard } from './board';
import { crowd } from './crowd';
import { baubles, ringsideElf, juggler } from './juggler';
import { circusRing, spotlight, tentWalls } from './tent';

/** The act so far and the best of the visit: the Big Top's one memory between frames. */
let ring: Ring | undefined;

/**
 * Santa's Big Top, inside: the Juggling Elf. Baubles arc over the circus ring,
 * and a tap on one as it falls tosses it back up. Every five catches the
 * ringside elf throws in another, the arcs get quicker, and a drop ends the act
 * to applause or gasps. With nobody playing, the elf juggles on its own.
 */
const attraction: NorthPoleSquare = {
  id: 'big-top',
  name: "Santa's Big Top",
  description:
    'Juggling Elf: tap each bauble as it falls to toss it back up, keep them all in the air as more join in.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'tent', roof: 'berry', trim: 'snow', landmark: 'big-top' },
  draw(ctx, size, time, pointer) {
    const state = advance(ring ?? newRing(time), time, pointer, size);
    ring = state;
    const { act } = state;
    scene(ctx, size, time, () => {
      tentWalls(ctx, time);
      circusRing(ctx);
      spotlight(ctx, time);
      ringsideElf(ctx, act, time);
      juggler(ctx, act, time);
      baubles(ctx, act, time);
      pop(ctx, act, time);
      crowd(ctx, state, time);
      scoreboard(ctx, state);
      hint(ctx, act, time);
      card(ctx, state, time);
    });
  },
};

export default attraction;
