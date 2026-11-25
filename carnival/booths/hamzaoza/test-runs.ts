/**
 * Plays the game frame by frame for the booth's tests, as the map would at 60
 * frames a second, so each test reads as what a visitor does.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import type { Kind, Thing } from './course';
import { advance, type Game } from './game';

/** The size of square the tests play on. */
export const SIZE = 200;
/** One frame at 60 frames a second, in ms. */
export const FRAME = 1000 / 60;

/** Plays `ms` of frames from `game`, with the same pointer every frame. */
export function play(game: Game, ms: number, pointer?: SquarePointer): Game {
  let g = game;
  const end = g.last + ms;
  for (let t = g.last + FRAME; t <= end; t += FRAME) g = advance(g, t, pointer, SIZE);
  return g;
}

/** The pointer resting over the drawing at `x`, without a press. */
export const hover = (x: number): SquarePointer => ({ x, y: SIZE / 2, down: false, presses: 0 });

/** One tap on the drawing at `x`. */
export const tap = (x: number): SquarePointer => ({ x, y: SIZE / 2, down: true, presses: 1 });

/** The first snowflake, rock or drift of the given kinds on `course`, which the test needs to exist. */
export function firstOnCourse(course: Thing[], ...kinds: Kind[]): Thing {
  const found = course.find((t) => kinds.includes(t.kind));
  if (!found) throw new Error(`no ${kinds.join(' or ')} on this stretch of the course`);
  return found;
}
