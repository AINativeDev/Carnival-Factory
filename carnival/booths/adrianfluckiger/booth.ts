/**
 * Visit Santa: a line of kids waits to meet Santa. The elf fetches each child in
 * turn, they sit on his lap to ask for presents, and when they hop down Santa
 * hands the reindeer a carrot to munch. Everything moves from `time` alone.
 */
import { scene } from '../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../src/northpole/square';
import { drawCarrot, drawChild, drawChildOnLap, drawDog, drawElf, drawReindeer } from './figures';
import { drawClearing, drawSanta } from './santa';
import { hasDog, momentAt, SPOTS, type ChildAt } from './story';

/** A child on the ground, with the family dog trotting behind if they have one. */
function drawWalker(ctx: CanvasRenderingContext2D, child: ChildAt, time: number) {
  const walk = time / 120 + child.index;
  if (hasDog(child.index)) drawDog(ctx, child.x + 7, child.y, walk * 1.4);
  drawChild(ctx, child.x, child.y, child.index, walk);
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
      drawReindeer(art, SPOTS.reindeer, 70, now.munch, time);
      drawSanta(art, time);
      if (now.child.sitting) drawChildOnLap(art, now.child.x, now.child.y, now.child.index);
      drawElf(art, now.elfX, 72, now.elfLeading, time / 120);
      for (const child of [...now.waiting].reverse()) drawWalker(art, child, time);
      if (!now.child.sitting) drawWalker(art, now.child, time);
      if (now.carrot) drawCarrot(art, now.carrot.x, now.carrot.y);
    });
  },
};

export default booth;
