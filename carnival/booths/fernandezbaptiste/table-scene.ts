/**
 * The whole scene, back to front: the pines and their lights, the elves, the
 * lantern and the table, the cards on it, the elves' arms over the cards, and
 * the words on top. The order matters, since later strokes cover earlier ones.
 */
import { iso, pine, stringLights } from '../../../src/northpole/diorama';
import type { Point } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { label } from './brush';
import type { Ctx } from './brush';
import { chips, lantern, SPOTS, table, TOP } from './card-table';
import { flatCard, jitter, stack, THICK } from './cards';
import { both, other, PLAYERS, seat } from './deck';
import { arms, bubble, elf, ELF_SIZE, ELVES } from './elves';
import { cardInAir, posesOf } from './poses';
import type { View } from './table-view';
import { ELF, YOU } from './visitor-game';

const { colors } = theme;

/** The back of the scene: two pines, with a string of lights from each to the lantern post. */
function backdrop(ctx: Ctx, time: number) {
  const pines = [iso(-19, 10), iso(10, -19)];
  for (const p of pines) pine(ctx, p.x, p.y, 15);
  const post = iso(-12, -12, 32);
  const bulbs: Point[] = [];
  for (const p of pines) {
    for (let n = 1; n < 6; n++) {
      const k = n / 6;
      bulbs.push({
        x: p.x + (post.x - p.x) * k,
        y: p.y - 13 + (post.y - p.y + 13) * k + Math.sin(k * Math.PI) * 3,
      });
    }
  }
  stringLights(ctx, bulbs, [colors.lantern, colors.berry, colors.gold, colors.mint], time);
}

/** The face-up pile, slightly tossed, sliding to the winner once it's won. */
function pile(ctx: Ctx, view: View, landed: number) {
  const to = seat(SPOTS.hands, view.taker);
  view.pile.slice(0, landed).forEach((card, n) => {
    const j = jitter(n);
    const gx = j.gx + (to.gx - j.gx) * view.slide;
    const gy = j.gy + (to.gy - j.gy) * view.slide;
    // Rise as it slides, so it lands on top of the winner's stack rather than through it.
    const z = TOP + 0.05 + (n + seat(view.stacks, view.taker) * view.slide) * THICK;
    if (view.slide < 1) flatCard(ctx, gx, gy, z, card);
  });
}

/** Draws `view` at `time`, in the scene's own units, for the diorama's `scene`. */
export function paint(ctx: Ctx, time: number, view: View) {
  backdrop(ctx, time);
  const feet = both((who) => iso(seat(ELVES, who).gx, seat(ELVES, who).gy));
  const inAir = cardInAir(view);
  const poses = posesOf(view, feet, inAir);

  // The elves, standing either side of the table.
  elf(ctx, feet[0], 1, 0, poses[0]);
  elf(ctx, feet[1], -1, 1, poses[1]);

  lantern(ctx, time);
  table(ctx);

  chips(ctx, 0, view.chips[0]);
  chips(ctx, 1, view.chips[1]);

  // The deck in the middle while dealing and gathering, and each elf's stack.
  stack(ctx, SPOTS.pile.gx, SPOTS.pile.gy, view.deck);
  for (const who of PLAYERS) {
    const spot = seat(SPOTS.hands, who);
    stack(ctx, spot.gx, spot.gy, seat(view.stacks, who));
  }

  pile(ctx, view, view.pile.length - (view.flying === null ? 0 : 1));
  if (inAir && view.flying !== null) {
    const { card, at, z, fold } = inAir;
    flatCard(ctx, at.gx, at.gy, z, view.flying > 0.5 ? card : null, Math.max(0.08, fold));
  }

  // Hands go over the cards: the loser's lands on the winner's in a slap.
  const first = view.taker;
  const second = other(first);
  arms(ctx, seat(feet, first), first, seat(poses, first));
  arms(ctx, seat(feet, second), second, seat(poses, second));

  if (view.bubble && view.bubble.alpha > 0) {
    const { who, text, alpha } = view.bubble;
    const foot = seat(feet, who);
    bubble(
      ctx,
      foot.x + (who === 0 ? -3 : 3),
      foot.y - 19 * ELF_SIZE - seat(poses, who).hop,
      text,
      alpha,
    );
  }

  // The score in the corner, and what a tap does now.
  if (view.score) {
    label(ctx, 4, 6, `You ${seat(view.score, YOU)}`, colors.gold, 'left');
    label(ctx, 4, 11, `Elf ${seat(view.score, ELF)}`, colors.cream, 'left');
  }
  if (view.hint) label(ctx, 50, 95, view.hint, colors.cream, 'center');
}
