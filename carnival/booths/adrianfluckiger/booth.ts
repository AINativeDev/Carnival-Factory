/**
 * Visit Santa: a line of kids waits to meet Santa. The elf fetches each child in
 * turn, they sit on his lap to ask for presents, and when they hop down Santa
 * hands the reindeer a carrot to munch. Everything moves from `time` alone.
 */
import { scene } from '../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../src/northpole/square';
import { drawChild, drawChildOnLap, drawDog, drawElf } from './figures';
import { drawCarrot, drawReindeer } from './reindeer';
import { drawClearing, drawSanta } from './santa';
import { hasDog, momentAt, SPOTS, type ChildAt } from './story';

/**
 * A child, with the family dog trotting at their side if they have one. The dog
 * stays by them while they sit on Santa's lap, so it never vanishes mid-visit.
 */
function drawVisitor(ctx: CanvasRenderingContext2D, child: ChildAt, time: number) {
  const walk = time / 120 + child.index;
  if (hasDog(child.index)) drawDog(ctx, child.x - 3, child.y + 3, walk * 1.4, child.alpha);
  if (child.sitting) drawChildOnLap(ctx, child.x, child.y, child.index);
  else drawChild(ctx, child.x, child.y, child.index, walk, child.alpha);
}

/** The Visit Santa booth: a gazebo whose front shows the line to Santa's chair. */
const booth: NorthPoleSquare = {
  id: 'adrianfluckiger',
  name: 'Visit Santa',
  description:
    "Kids queue to sit on Santa's lap, and the reindeer gets a carrot from each one who hops down.",
  stall: { shape: 'gazebo', roof: 'berry', trim: 'snow' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (art) => {
      const now = momentAt(time);
      drawClearing(art, time);
      drawReindeer(art, SPOTS.reindeer, SPOTS.reindeerGround, now.munch, time);
      drawSanta(art, time);
      if (now.child.sitting) drawVisitor(art, now.child, time);
      drawElf(art, now.elfX, 72, now.elfLeading, time / 120);
      for (const child of [...now.waiting].reverse()) drawVisitor(art, child, time);
      if (!now.child.sitting) drawVisitor(art, now.child, time);
      if (now.carrot) drawCarrot(art, now.carrot.x, now.carrot.y);
    });
  },
};

export default booth;
