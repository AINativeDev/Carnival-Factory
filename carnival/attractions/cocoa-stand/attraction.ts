import type { NorthPoleSquare } from '../../../src/northpole/square';
import { iso, scene } from '../../../src/northpole/diorama';
import { bubble } from './bubble';
import { cup, spill } from './cup';
import { queue } from './elves';
import { boards, card, oops } from './hud';
import { panel } from './panel';
import { advance, newStand, SPILL, type Stand } from './rush';
import { hut } from './stand';

/** The shift so far and the best tips of the visit: the stand's one memory between frames. */
let stand: Stand | undefined;

/** Where the cup stands on the counter. */
const CUP = iso(4, 10, 12);

/**
 * The Hot Cocoa Stand, as Cocoa Rush: elves queue at the hatch with their
 * orders, and the visitor builds each cup with the buttons on the counter,
 * cocoa first and then the toppings in the order asked for, before the
 * customer's patience runs out. Tips for the right cup, a spill for a wrong
 * topping, and three walk-offs end the shift.
 */
const attraction: NorthPoleSquare = {
  id: 'cocoa-stand',
  name: 'Hot Cocoa Stand',
  description:
    'Cocoa Rush: build each elf’s cocoa with its toppings in the right order before their patience runs out.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'kiosk', roof: 'cocoa', trim: 'cream', landmark: 'cocoa-hut' },
  draw(ctx, size, time, pointer) {
    const state = advance(stand ?? newStand(time), time, pointer, size);
    stand = state;
    const { shift } = state;
    scene(ctx, size, time, () => {
      hut(ctx, time);
      const spilled = time - shift.spilled;
      const last = shift.pressed;
      const newest = last?.verdict === 'right' ? last.at : -Infinity;
      if (spilled >= 0 && spilled < SPILL) spill(ctx, CUP, spilled);
      else cup(ctx, CUP, shift.made, newest, time);
      queue(ctx, shift, time);
      bubble(ctx, shift, time);
      panel(ctx, shift, time);
      oops(ctx, state, time, CUP);
      boards(ctx, state);
      card(ctx, state, time);
    });
  },
};

export default attraction;
