/**
 * The cards and the two players at the table, as plain functions: the deck,
 * its seeded shuffle and deal, and what makes a snap. The elves' own rounds
 * and the visitor's game both deal from here, so they play by one set of rules.
 */

/** A card: its rank, 1 to `RANKS`, shown as that many pips, and its suit, 0 to `SUITS` - 1. */
export interface Card {
  rank: number;
  suit: number;
}

/** How many ranks the deck has, so a card never shows more pips than fit on its face. */
export const RANKS = 5;
/** How many suits the deck has, one pip colour each. */
export const SUITS = 4;

/** One of the two elves at the table: 0 on the left, 1 on the right. */
export type Player = 0 | 1;

/** Both players, the left elf first, for whatever happens to each of them in turn. */
export const PLAYERS: readonly [Player, Player] = [0, 1];

/** One thing for each player, the left elf's first, such as where each one stands. */
export function both<T>(make: (who: Player) => T): [T, T] {
  return [make(0), make(1)];
}

/**
 * What `who` has of something both players have, such as their hand or their
 * score. Every lookup by player goes through here: the booth gate's code check
 * reads each file on its own, so an index typed by `Player` from another file
 * would look like a string key to it.
 */
export function seat<Left, Right>(pair: readonly [Left, Right], who: Player): Left | Right {
  return who === 0 ? pair[0] : pair[1];
}

/** `pair` with what `who` has replaced by `value`, such as their score after a slap. */
export function withSeat<T>(pair: readonly [T, T], who: Player, value: T): [T, T] {
  return who === 0 ? [value, pair[1]] : [pair[0], value];
}

/** The player across the table from `player`: whose turn comes next, and who lost a slap. */
export function other(player: Player): Player {
  return player === 0 ? 1 : 0;
}

/** Every card once, rank by rank: `RANKS` times `SUITS` cards. */
export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (let rank = 1; rank <= RANKS; rank++) {
    for (let suit = 0; suit < SUITS; suit++) deck.push({ rank, suit });
  }
  return deck;
}

/** A small seeded random number generator: the same seed always gives the same numbers, 0 to 1. */
export function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The deck shuffled by `seed`, the same way every time. Leaves `deck` as it was. */
export function shuffle(deck: readonly Card[], seed: number): Card[] {
  const next = random(seed);
  const cards = [...deck];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const [top, picked] = [cards.at(i), cards.at(j)];
    if (top && picked) [cards[i], cards[j]] = [picked, top];
  }
  return cards;
}

/** Deals the deck one card at a time, left elf first, into two face-down hands. */
export function deal(deck: readonly Card[]): [Card[], Card[]] {
  return [deck.filter((_, i) => i % 2 === 0), deck.filter((_, i) => i % 2 === 1)];
}

/** Snap: the two cards on top of the pile have the same rank. */
export function isSnap(pile: readonly Card[]): boolean {
  const [under, top] = [pile.at(-2), pile.at(-1)];
  return under !== undefined && top !== undefined && top.rank === under.rank;
}
