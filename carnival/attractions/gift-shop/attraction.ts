import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { scene } from '../../../src/northpole/diorama';
import { card } from './card';
import { counter } from './counter';
import { shop } from './shop';
import { START, revealing, swatchAt, tap, type Wrapping } from './wrapping';

/** The shelf's gifts, which `scripts/gift-shelf.test.ts` checks against `plugins/north-pole-gifts/`. */
export { GIFTS } from './gifts';

/** What's been wrapped so far, and what's chosen for the next one: the shop's one memory of the pointer. */
let wrapping: Wrapping = START;

/** A gift shop where visitors wrap the North Pole's gift skills, and the window fills with parcels. */
const attraction: NorthPoleSquare = {
  id: 'gift-shop',
  name: 'Gift Shop',
  description:
    'Wrap a present: pick the paper, the ribbon and the bow, and fill the window with gifts you can install.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'stall', roof: 'pine', trim: 'cream', landmark: 'shopfront' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    // The pointer in the square's own 0 to 100 units, where the card's swatches are laid out.
    const x = pointer ? (pointer.x * 100) / size : -1;
    const y = pointer ? (pointer.y * 100) / size : -1;
    for (let n = 0; n < (pointer?.presses ?? 0); n++) wrapping = tap(wrapping, x, y, time);
    const over = pointer && !revealing(wrapping, time) ? swatchAt(x, y) : -1;
    scene(ctx, size, time, () => {
      shop(ctx, time, wrapping);
      counter(ctx, time, wrapping);
      card(ctx, wrapping, time, over);
    });
  },
};

export default attraction;
