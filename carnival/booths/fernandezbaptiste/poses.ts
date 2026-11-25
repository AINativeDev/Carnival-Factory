/**
 * Where the elves' hands are and the flipped card is at one moment: resting
 * by their stacks, reaching for the pile, carrying a card through the air,
 * cheering or sulking. Worked out before anything is drawn, because the arms
 * go over the table and the cards.
 */
import { iso } from '../../../src/northpole/diorama';
import type { Point } from '../../../src/northpole/diorama';
import { lerp } from './brush';
import { SPOTS, TOP } from './card-table';
import { THICK, jitter } from './cards';
import { both, seat, withSeat } from './deck';
import type { Card } from './deck';
import { ELF_SIZE, towardTable } from './elves';
import type { Pose } from './elves';
import { ease } from './round-clock';
import type { View } from './table-view';

/** The card in the air: where it is on the table, how high, and how far it has turned over. */
export interface InAir {
  card: Card;
  at: { gx: number; gy: number };
  z: number;
  fold: number;
}

/** The card on its way from its elf's stack to the pile, turning over as it goes, or null. */
export function cardInAir(view: View): InAir | null {
  const landed = view.pile.length - (view.flying === null ? 0 : 1);
  const card = view.pile.at(landed);
  if (view.flying === null || card === undefined) return null;
  const from = seat(SPOTS.hands, view.flipper);
  const to = jitter(landed);
  const k = ease(view.flying);
  return {
    card,
    at: { gx: from.gx + (to.gx - from.gx) * k, gy: from.gy + (to.gy - from.gy) * k },
    z: TOP + Math.sin(k * Math.PI) * 3 + landed * THICK,
    fold: Math.abs(Math.cos(k * Math.PI)),
  };
}

/** How each elf stands, with its feet at `feet`: reaching, flipping, cheering or sulking. */
export function posesOf(view: View, feet: [Point, Point], inAir: InAir | null): [Pose, Pose] {
  // Where the hands rest, and where each elf reaches.
  const pileAt = iso(SPOTS.pile.gx, SPOTS.pile.gy, TOP + 1);
  let poses = both((who): Pose => {
    const spot = seat(SPOTS.hands, who);
    const foot = seat(feet, who);
    const rest = iso(spot.gx, spot.gy, TOP + 1.6);
    const side = foot.x - towardTable(who) * 2 * ELF_SIZE;
    const ready = lerp(rest, foot, 0.15);
    return {
      hands: [{ x: side, y: foot.y - 4.5 * ELF_SIZE }, lerp(ready, pileAt, seat(view.reach, who))],
      hop: 0,
    };
  });
  if (inAir) {
    const { hands, hop } = seat(poses, view.flipper);
    const carrying = iso(inAir.at.gx, inAir.at.gy, inAir.z + 0.6);
    poses = withSeat(poses, view.flipper, { hands: [hands[0], carrying], hop });
  }
  if (view.cheer) {
    const { who, progress } = view.cheer;
    const foot = seat(feet, who);
    const hop = Math.abs(Math.sin(progress * Math.PI * 3)) * 2;
    poses = withSeat(poses, who, {
      hands: [
        { x: foot.x - towardTable(who) * 3 * ELF_SIZE, y: foot.y - 13 * ELF_SIZE - hop },
        { x: foot.x + towardTable(who) * 3 * ELF_SIZE, y: foot.y - 13 * ELF_SIZE - hop },
      ],
      hop,
    });
  }
  if (view.sulk !== null) {
    const who = view.sulk;
    const foot = seat(feet, who);
    poses = withSeat(poses, who, {
      hands: [
        { x: foot.x - towardTable(who) * 2 * ELF_SIZE, y: foot.y - 3.6 * ELF_SIZE },
        { x: foot.x + towardTable(who) * 2 * ELF_SIZE, y: foot.y - 3.6 * ELF_SIZE },
      ],
      hop: seat(poses, who).hop,
    });
  }
  return poses;
}
