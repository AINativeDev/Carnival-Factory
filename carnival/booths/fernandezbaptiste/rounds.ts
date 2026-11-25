/**
 * The elves' own rounds of Snap, played when nobody else is: each round is a
 * shuffle chosen so its snap comes on the same flip, which keeps the scene's
 * timing fixed while every round still deals differently.
 */
import { deal, isSnap, makeDeck, other, random, seat, shuffle, withSeat } from './deck';
import type { Card, Player } from './deck';

/** One card flipped onto the pile, and who flipped it. */
export interface Flip {
  player: Player;
  card: Card;
}

/**
 * The elves take turns, `first` first, each flipping the top card of their
 * hand onto the pile, until the pile shows a snap or a hand runs out.
 */
export function playUntilSnap(
  hands: readonly [readonly Card[], readonly Card[]],
  first: Player,
): { flips: Flip[]; snapped: boolean } {
  const flips: Flip[] = [];
  const pile: Card[] = [];
  let next: [number, number] = [0, 0];
  let player = first;
  for (;;) {
    const card = seat(hands, player).at(seat(next, player));
    if (card === undefined) return { flips, snapped: false };
    next = withSeat(next, player, seat(next, player) + 1);
    flips.push({ player, card });
    pile.push(card);
    if (isSnap(pile)) return { flips, snapped: true };
    player = other(player);
  }
}

/** Every round has this many flips, the last one making the snap, so the scene can time it. */
export const FLIPS = 5;

/** One of the elves' rounds: how it was dealt, how it was flipped, and who won it. */
export interface Round {
  /** Who flips first: the elves take turns round by round. */
  first: Player;
  hands: [Card[], Card[]];
  /** The `FLIPS` flips, the last one a snap. */
  flips: Flip[];
  /** Who slaps the pile first, and wins it. */
  winner: Player;
}

function seedFor(index: number, attempt: number) {
  return (Math.imul(index, 2654435761) ^ Math.imul(attempt + 1, 40503)) >>> 0;
}

/**
 * Round `index` of the game, the same every time: a shuffle whose snap comes
 * on exactly the `FLIPS`th flip, and whoever is quicker to slap it.
 */
export function roundAt(index: number): Round {
  const first: Player = ((index % 2) + 2) % 2 === 0 ? 0 : 1;
  for (let attempt = 0; ; attempt++) {
    const seed = seedFor(index, attempt);
    const hands = deal(shuffle(makeDeck(), seed));
    const { flips, snapped } = playUntilSnap(hands, first);
    if ((snapped && flips.length === FLIPS) || attempt > 500) {
      const winner: Player = random(seed ^ 0x5eed)() < 0.5 ? 0 : 1;
      return { first, hands, flips, winner };
    }
  }
}

/** A game is this many rounds; the score on the table counts the rounds won in this game so far. */
export const GAME = 5;

/** How many rounds each elf has won in the current game before round `index`, or through it with `through`. */
export function tally(index: number, through = false): [number, number] {
  const start = index - (((index % GAME) + GAME) % GAME);
  let score: [number, number] = [0, 0];
  for (let i = start; i < index + (through ? 1 : 0); i++) {
    const { winner } = roundAt(i);
    score = withSeat(score, winner, seat(score, winner) + 1);
  }
  return score;
}
