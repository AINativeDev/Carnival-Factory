/**
 * The elf who drives the sleigh when nobody's playing, and the presents hung
 * over the course. The elf pushes until the gauge reads the middle of the next
 * crest's airtime, and lets go there, so it flies every crest and never off
 * the rails. The presents hang where its sleigh flies highest over the rail,
 * over some of the crests, so a rider who flies like the elf catches them.
 */
import { AT_STATION, crestReading, heightOf, step, type Sleigh } from './physics';
import { heightAt, HILLS } from './track';

/** Where a present floats: along the track and up, in metres. */
export interface Present {
  x: number;
  y: number;
}

/** How high the middle of the sleigh rides above the rail, in metres. */
export const SLEIGH_MIDDLE = 2.5;
/** How close the sleigh's middle must pass a present to catch it, in metres. */
export const REACH = 4;
/** How far up the elf drives before the presents stop: further than any run's clock allows. */
const COURSE_END = (HILLS.at(-1)?.crest ?? 0) - 60;
/** The least the sleigh must fly above the rail for a present to hang there, in metres. */
const HIGH_ENOUGH = 2.5;

/** The speed over the crest the elf aims for: a little past the middle of the airtime. */
function aim(lift: number, crash: number): number {
  return Number.isFinite(crash) ? lift + 0.45 * (crash - lift) : 20;
}

/** Whether the elf pushes now: while the gauge reads short of its aim for the next crest. */
export function elfPushes(sleigh: Sleigh): boolean {
  const { over, lift, crash } = crestReading(sleigh);
  return over < aim(lift, crash);
}

/** Whether a present at every `n`th flight hangs there: two in three of them, the same every ride. */
const hangs = (n: number) => n % 3 !== 1;

/**
 * Drives the elf's sleigh the whole course and hangs a present at the
 * highest point of two in every three of its flights.
 */
export function hangPresents(): Present[] {
  const presents: Present[] = [];
  let sleigh = AT_STATION;
  let peak: Present | undefined;
  let peakAir = 0;
  let flights = 0;
  while (sleigh.x < COURSE_END && !sleigh.off) {
    sleigh = step(sleigh, elfPushes(sleigh));
    const above = heightOf(sleigh) - heightAt(sleigh.x);
    if (sleigh.air && above > peakAir) {
      peakAir = above;
      peak = { x: sleigh.x, y: heightOf(sleigh) + SLEIGH_MIDDLE };
    }
    if (!sleigh.air && peak) {
      if (peakAir >= HIGH_ENOUGH && hangs(flights++)) presents.push(peak);
      [peak, peakAir] = [undefined, 0];
    }
  }
  return presents;
}

/** The presents, hung once, the first time they're asked for. */
let hung: Present[] | undefined;

/** The presents over the course, the same for every ride. */
export function presents(): Present[] {
  hung ??= hangPresents();
  return hung;
}

/** The presents a sleigh at `sleigh` reaches now, by their place in `presents()`. */
export function reached(sleigh: Sleigh, all: readonly Present[]): number[] {
  const y = heightOf(sleigh) + SLEIGH_MIDDLE;
  const near: number[] = [];
  all.forEach((present, n) => {
    if (Math.abs(present.x - sleigh.x) < REACH && Math.abs(present.y - y) < REACH) near.push(n);
  });
  return near;
}
