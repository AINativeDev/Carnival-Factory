/**
 * Santa's Toy Factory: puts the workshop's parts together in the order they
 * stand, back to front, and keeps the booth's one memory of the pointer.
 */
import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { drawBelt, drawLetters, drawSparks, drawTick } from './belt';
import { drawCube } from './cube';
import { drawElves } from './elves';
import { lettersAt } from './letters';
import { drawPenguin, hopHeight, penguinAt, PENGUINS } from './penguins';
import { drawRoom } from './room';
import { drawSleigh } from './sleigh';
import { restingSpin, stepSpin } from './spin';
import { drawSnowGlobe, onGlobe } from './snow-globe';
import { drawCheckLamp, drawToySign } from './tallies';

/** When each penguin was last tapped, so it can hop: the booth's one memory of the pointer. */
const tapped: number[] = PENGUINS.map(() => -Infinity);
/** When the snow globe was last tapped. */
let globeTapped = -Infinity;

/** The interlocking cube on the wall: its turn, and when it was last drawn. */
let spin = restingSpin();
let lastTime = -Infinity;

/** Santa's toy factory: letters in, sorted, built into toys, checked and into the sleigh. */
const booth: NorthPoleSquare = {
  id: 'jedi4ever',
  name: "Santa's Toy Factory",
  description: 'Letters in, toys out: the workshop that builds the whole North Pole.',
  stall: { shape: 'cabin', roof: 'berry', trim: 'gold' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    const u = size / 100;
    const letters = lettersAt(time);

    drawRoom(ctx, u, size, time);
    drawCheckLamp(ctx, u, time);
    drawToySign(ctx, u, time);
    drawElves(ctx, u, time, letters);
    drawBelt(ctx, u, time);
    drawSleigh(ctx, u, time);
    drawLetters(ctx, u, letters);
    drawSparks(ctx, u, time, letters);
    drawTick(ctx, u, letters);

    // The cube spins while the pointer is held, a little faster the longer it is, and coasts to rest.
    const dt = Math.min(0.1, Math.max(0, (time - lastTime) / 1000));
    lastTime = time;
    spin = stepSpin(spin, Number.isFinite(dt) ? dt : 0, pointer?.down === true);
    drawCube(ctx, 30 * u, 40 * u, 9 * u, spin.angle);

    // The snow globe swirls when tapped.
    if (pointer && pointer.presses > 0 && onGlobe(pointer.x / u, pointer.y / u)) globeTapped = time;
    drawSnowGlobe(ctx, u, time - globeTapped);

    // The penguins on the floor: one waves while the pointer is over it, and hops when tapped.
    // Typed here, not only where they're made: the static code check reads this
    // file on its own, and indexes only by what it can see is a number.
    const lifts: number[] = tapped.map((at) => hopHeight(time - at));
    const over: number = pointer ? penguinAt(pointer.x / u, pointer.y / u, time, lifts) : -1;
    if (pointer && pointer.presses > 0 && over >= 0) tapped[over] = time;
    PENGUINS.forEach((spot, index: number) => {
      drawPenguin(ctx, u, spot, index, time, index === over, lifts[index] ?? 0);
    });
  },
};

export default booth;
