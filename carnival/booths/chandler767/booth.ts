import { iso, pine, scene } from '../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../src/northpole/square';
import { cliff, pool } from './falls';
import { hut } from './waffle-hut';

type Ctx = CanvasRenderingContext2D;

// The snowy pines around the falls and the hut, as [x, y, height]: typed as triples so strict indexing knows each is there.
const PINES: readonly (readonly [number, number, number])[] = [
  [-19, 8, 16],
  [-13, 14, 12],
  [19, -10, 14],
];

function draw(ctx: Ctx, size: number, time: number) {
  scene(ctx, size, time, (c, t) => {
    cliff(c, t);
    pool(c);
    for (const [gx, gy, h] of PINES) {
      const p = iso(gx, gy);
      pine(c, p.x, p.y, h);
    }
    hut(c, t);
  });
}

const booth: NorthPoleSquare = {
  id: 'chandler767',
  name: 'Frozen Falls Waffles',
  description: 'A frozen waterfall, and a hut where someone sells hot Belgian waffles.',
  draw,
};

export default booth;
