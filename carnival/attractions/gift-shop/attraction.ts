import type { NorthPoleSquare } from '../../../src/northpole/square';
import { scene } from '../../../src/northpole/diorama';
import { giftInSpotlight, inSpotlight } from './gifts';
import { giftTag } from './gift-tag';
import { shop } from './shop';

/** The shelf's gifts, which `scripts/gift-shelf.test.ts` checks against `plugins/north-pole-gifts/`. */
export { GIFTS } from './gifts';

/** A gift shop whose shelves hold the North Pole's gift skills, each in the spotlight in turn. */
const attraction: NorthPoleSquare = {
  id: 'gift-shop',
  name: 'Gift Shop',
  description:
    'Five small factory loops wrapped as gifts, each installable on your own repository with one command.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'stall', roof: 'pine', trim: 'cream', landmark: 'shopfront' },
  draw(ctx, size, time) {
    scene(ctx, size, time, () => {
      shop(ctx, time, inSpotlight(time));
      giftTag(ctx, giftInSpotlight(time));
    });
  },
};

export default attraction;
