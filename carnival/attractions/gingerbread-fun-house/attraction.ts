/**
 * The Gingerbread Fun House: a crooked gingerbread house where visitors play
 * Icing Echo. The house plays a tune by lighting its notes (its mirror
 * windows, its candy-cane door and the big gumdrops on its roof) and you tap
 * them back; each round adds a note, and from round 4 the fun-house mirrors
 * swap two notes' places. Every right note sticks a treat where you tapped;
 * a wrong one cracks the icing and the house wobbles. An elf strolls past the
 * mirror windows, stretched tall and squashed wide as it goes by.
 */
import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { scene } from '../../../src/northpole/diorama';
import { lean, onHouse, wobble } from './decorating';
import { advance, newEcho, type Echo } from './echo';
import { fixtures, travelling } from './fixtures';
import { drawHouse, leaning } from './house';
import { banner, overCard } from './hud';
import { lightOf, slotOf, whereIs } from './light';
import { MIRRORS } from './mirrors';
import { sparkles } from './sparkle';
import { mirrored, strollingElf, treat } from './stroller';
import { notesIn } from './tune';

export { CHASE, gumdropLit } from './house';

/**
 * The game: the fun house's one memory, kept for as long as the square's
 * frame lives, so it can outlast a visit, and nothing saves it.
 */
let echo: Echo | undefined;

/** How far the house is turned at `time`: its slow sway, and the wobble after a wrong note. */
function turnOf(game: Echo, time: number): number {
  return lean(time) + (game.overAt === null ? 0 : wobble(time - game.overAt));
}

/** Draws the house and its notes as they are at `time`, turned `turn` radians. */
function paint(ctx: CanvasRenderingContext2D, game: Echo, time: number, turn: number) {
  const count = notesIn(game.round);
  const notes = Array.from({ length: count }, (_, note) => note);
  const moving = notes.filter((note) => whereIs(game, note, time).moving > 0);
  const noteAt = (slot: number) =>
    notes.find((note) => slotOf(game, note, time) === slot && !moving.includes(note)) ?? -1;
  drawHouse(ctx, turn, time, () => {
    fixtures(
      ctx,
      noteAt,
      (note) => lightOf(game, note, time),
      (at, r, mirror) => {
        const bends = MIRRORS.at(mirror);
        if (bends) mirrored(ctx, time, at, r, bends);
      },
      () => {
        for (const placed of game.treats.placed) treat(ctx, placed, time);
      },
    );
  });
  leaning(ctx, turn, () => {
    for (const note of moving) {
      const { at, moving: how } = whereIs(game, note, time);
      travelling(ctx, note, at, how, time);
    }
    sparkles(ctx, game, time);
  });
}

const attraction: NorthPoleSquare = {
  id: 'gingerbread-fun-house',
  name: 'Gingerbread Fun House',
  description:
    'Icing Echo: the crooked gingerbread house lights up a tune of notes for you to tap back, one longer each round, while its fun-house mirrors swap them round.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'cabin', roof: 'gingerbread', trim: 'snow', landmark: 'gingerbread-house' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    let game = echo ?? newEcho(time, 'demo', 0);
    const presses = pointer?.presses ?? 0;
    // A tap is turned back onto the leaning house, so it lands where it looks.
    const on = onHouse(
      ((pointer?.x ?? 0) * 100) / size,
      ((pointer?.y ?? 0) * 100) / size,
      turnOf(game, time),
    );
    game = advance(game, time, on.x, on.y, presses);
    echo = game;
    scene(ctx, size, time, () => {
      const turn = turnOf(game, time);
      paint(ctx, game, time, turn);
      strollingElf(ctx, time);
      banner(ctx, game, time);
      overCard(ctx, game, time);
    });
  },
};

export default attraction;
