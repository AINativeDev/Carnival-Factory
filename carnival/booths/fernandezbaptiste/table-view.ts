/**
 * What the table shows at one moment, worked out the same way whether the
 * elves play each other or the visitor plays: the scene draws a `View` and
 * never needs to know which game it came from.
 */
import { other, withSeat } from './deck';
import type { Card, Player } from './deck';
import { ease, FLIGHT, flipsAt, momentAt, stacksAt } from './round-clock';
import { FLIPS, roundAt, tally } from './rounds';
import { ELF, ELF_QUICKEST, REST, TAKE, YOU } from './visitor-game';
import type { Game } from './visitor-game';

/** What the table shows at one moment, whether the elves play each other or the visitor plays. */
export interface View {
  /** Face-down cards in each elf's stack, and in the deck in the middle. */
  stacks: [number, number];
  deck: number;
  /** The face-up pile, bottom card first. Its top card may still be in the air. */
  pile: readonly Card[];
  /** How far the top card is through the air, 0 to 1, flipped by `flipper`, or null once it's down. */
  flying: number | null;
  flipper: Player;
  /** How far the pile has slid over to `taker`'s stack, 0 to 1. */
  slide: number;
  taker: Player;
  /** How far each elf's playing hand reaches from its stack to the pile, 0 to 1. */
  reach: [number, number];
  /** Who hops with their arms up, and how far through the hops; and who sulks. */
  cheer: { who: Player; progress: number } | null;
  sulk: Player | null;
  bubble: { who: Player; text: string; alpha: number } | null;
  chips: [number, number];
  /** The score, while the visitor plays. */
  score: [number, number] | null;
  hint: string | null;
}

/** The elves playing each other, from `time`. */
export function idleView(time: number, hovered: boolean): View {
  const moment = momentAt(time);
  const round = roundAt(moment.index);
  const { stage, progress } = moment;
  const { landed, flying } = flipsAt(moment);
  const counts = stacksAt(moment, round);
  const loser = other(round.winner);
  let reach: [number, number] = [0, 0];
  if (stage === 'slap') {
    reach = withSeat(reach, round.winner, ease(progress * 2.4));
    reach = withSeat(reach, loser, ease(progress * 1.6 - 0.15));
  }
  if (stage === 'cheer') reach = withSeat(reach, loser, 1 - ease(progress * 3));
  if (stage === 'collect') reach = withSeat(reach, round.winner, 1 - ease(progress));
  const shown = stage === 'deal' || stage === 'gather' ? 0 : landed + (flying === null ? 0 : 1);
  return {
    stacks: counts.hands,
    deck: counts.deck,
    pile: round.flips.slice(0, shown).map((f) => f.card),
    flying,
    flipper: round.flips[Math.min(landed, FLIPS - 1)]?.player ?? round.first,
    slide: stage === 'collect' ? ease(progress) : 0,
    taker: round.winner,
    reach,
    cheer: stage === 'cheer' ? { who: round.winner, progress } : null,
    sulk: null,
    bubble:
      stage === 'slap' || stage === 'cheer'
        ? {
            who: round.winner,
            text: 'SNAP!',
            alpha: stage === 'cheer' ? 1 - ease((progress - 0.75) / 0.25) : ease(progress * 3),
          }
        : null,
    chips: tally(moment.index, stage === 'collect' || stage === 'gather'),
    score: null,
    hint: hovered ? 'Tap to play Snap' : null,
  };
}

/** The visitor's game against the elf, at `time`. */
export function gameView(game: Game, time: number): View {
  const since = time - game.since;
  const flying =
    game.flipped && time - game.flipped.at < FLIGHT ? (time - game.flipped.at) / FLIGHT : null;
  let reach: [number, number] = [0, 0];
  let slide = 0;
  let bubble: View['bubble'] = null;
  if (game.phase === 'snap') {
    reach = withSeat(reach, ELF, ease((time - (game.elfSlap - ELF_QUICKEST)) / ELF_QUICKEST));
  }
  if (game.phase === 'won') {
    const k = since / TAKE;
    slide = ease((k - 0.45) / 0.55);
    reach = withSeat(reach, game.winner, Math.min(ease(k / 0.1), 1 - slide));
    reach = withSeat(
      reach,
      other(game.winner),
      Math.min(ease((k - 0.05) / 0.15), 1 - ease((k - 0.3) / 0.2)),
    );
    bubble = { who: game.winner, text: 'SNAP!', alpha: 1 - ease((k - 0.8) / 0.2) };
  }
  const over = game.phase === 'over';
  if (over)
    bubble = { who: game.winner, text: game.winner === YOU ? 'You win!' : 'I win!', alpha: 1 };
  let hint: string | null = null;
  if (game.phase === 'turn' && game.turn === YOU && flying === null) hint = 'Your turn: tap';
  if (over && since >= REST) hint = 'Tap to play again';
  return {
    stacks: [game.hands[0].length, game.hands[1].length],
    deck: 0,
    pile: game.pile,
    flying,
    flipper: game.flipped?.player ?? ELF,
    slide,
    taker: game.winner,
    reach,
    cheer: over ? { who: game.winner, progress: (since / 2_400) % 1 } : null,
    sulk: over ? other(game.winner) : null,
    bubble,
    chips: game.score,
    score: game.score,
    hint,
  };
}
