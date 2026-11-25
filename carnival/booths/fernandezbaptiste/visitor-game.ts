/**
 * Snap against the elf: the visitor plays the elf on the right, as plain
 * functions of the game so far and the time. The booth keeps only the result
 * between frames, so the whole game can be tested without drawing it.
 */
import { deal, isSnap, makeDeck, other, random, seat, shuffle, withSeat } from './deck';
import type { Card, Player } from './deck';
import { FLIGHT } from './round-clock';

/** The elf on the left, who plays the visitor. */
export const ELF: Player = 0;
/** The visitor's own elf, on the right. */
export const YOU: Player = 1;
/** The first to win this many piles wins the game. */
export const TARGET = 10;
/** How long the elf waits on its turn before it flips. */
export const ELF_FLIP = 900;
/** The elf slaps a snap this long after the card lands, plus up to `ELF_SPREAD` more. */
export const ELF_QUICKEST = 500;
/** How much slower than `ELF_QUICKEST` the elf may be, so a quick visitor can beat it. */
export const ELF_SPREAD = 500;
/** How long a won pile takes to go over to its winner. */
export const TAKE = 1_400;
/** A finished game waits this long before a tap starts the next, so a late slap doesn't. */
export const REST = 800;
/** With no tap for this long, the visitor has gone, and the elves play each other again. */
export const IDLE_AFTER = 20_000;

type Phase = 'turn' | 'snap' | 'won' | 'over';

/** The visitor's game against the elf, as it stands after the last thing that happened. */
export interface Game {
  /** Each player's face-down hand, top card first: the elf's, then the visitor's. */
  hands: [Card[], Card[]];
  /** The face-up pile, bottom card first. */
  pile: Card[];
  /** Whose flip is next. */
  turn: Player;
  /** Piles won this game. */
  score: [number, number];
  /** Waiting for a flip, a snap on the pile, a pile going to its winner, or the game won. */
  phase: Phase;
  /** When the phase began. */
  since: number;
  /** During a snap: when the elf's hand lands on the pile. */
  elfSlap: number;
  /** Who won the last pile, or the game. */
  winner: Player;
  /** When the top card of the pile was flipped, and by whom. */
  flipped: { at: number; player: Player } | null;
  /** The game's shuffle, and how many times its cards have been dealt. */
  seed: number;
  deals: number;
  /** When the visitor last tapped. */
  last: number;
}

/** How long the elf takes to slap a snap flipped at `time`, the same every time for that moment. */
export function elfDelay(time: number) {
  return FLIGHT + ELF_QUICKEST + random(Math.floor(time))() * ELF_SPREAD;
}

/** A new game, shuffled from `time`: the deck dealt, nothing won yet, and the elf to flip first. */
export function newGame(time: number): Game {
  const seed = Math.floor(time) >>> 0;
  return {
    hands: deal(shuffle(makeDeck(), seed)),
    pile: [],
    turn: ELF,
    score: [0, 0],
    phase: 'turn',
    since: time,
    elfSlap: 0,
    winner: ELF,
    flipped: null,
    seed,
    deals: 1,
    last: time,
  };
}

/** Whoever's turn it is flips their top card onto the pile. A player with no cards left calls for a new deal first. */
export function flip(game: Game, time: number): Game {
  const player = game.turn;
  let { hands, pile, deals } = game;
  if (seat(hands, player).length === 0) {
    hands = deal(shuffle(makeDeck(), (game.seed + Math.imul(deals, 7919)) >>> 0));
    pile = [];
    deals++;
  }
  const card = seat(hands, player).at(0);
  const rest = seat(hands, player).slice(1);
  // A fresh deal always gives the player cards, so there is always one to flip.
  if (card === undefined) return game;
  const next: Game = {
    ...game,
    hands: player === 0 ? [rest, hands[1]] : [hands[0], rest],
    pile: [...pile, card],
    deals,
    turn: other(player),
    phase: 'turn',
    since: time,
    flipped: { at: time, player },
  };
  return isSnap(next.pile) ? { ...next, phase: 'snap', elfSlap: time + elfDelay(time) } : next;
}

/** `who` slaps the snap first and wins the pile. */
function slap(game: Game, who: Player, time: number): Game {
  const score = withSeat(game.score, who, seat(game.score, who) + 1);
  return { ...game, score, phase: 'won', since: time, winner: who };
}

/** The won pile goes under its winner's hand, and the game goes on, or ends at `TARGET`. */
function take(game: Game, time: number): Game {
  const hands = withSeat(game.hands, game.winner, [...seat(game.hands, game.winner), ...game.pile]);
  const over = seat(game.score, game.winner) >= TARGET;
  return { ...game, hands, pile: [], flipped: null, phase: over ? 'over' : 'turn', since: time };
}

/** What happens by `time` with nobody tapping: the elf flips, slaps and takes piles on its own time. */
export function advance(game: Game, time: number): Game {
  let next = game;
  for (let n = 0; n < 100; n++) {
    if (next.phase === 'turn' && next.turn === ELF && time >= next.since + ELF_FLIP) {
      next = flip(next, next.since + ELF_FLIP);
    } else if (next.phase === 'snap' && time >= next.elfSlap) {
      next = slap(next, ELF, next.elfSlap);
    } else if (next.phase === 'won' && time >= next.since + TAKE) {
      next = take(next, next.since + TAKE);
    } else break;
  }
  return next;
}

/**
 * The visitor taps at `time`: on their turn it flips their card, on a snap it
 * slaps the pile, and once a game is won it starts the next.
 */
export function press(game: Game, time: number): Game {
  const tapped = { ...game, last: time };
  if (game.phase === 'turn' && game.turn === YOU) return flip(tapped, time);
  if (game.phase === 'snap' && time < game.elfSlap) return slap(tapped, YOU, time);
  if (game.phase === 'over' && time >= game.since + REST) return newGame(time);
  return tapped;
}

/**
 * The game at `time`, after `presses` taps since the last frame: null while
 * nobody plays. The first tap starts a game, and it ends when the visitor
 * hasn't tapped for `IDLE_AFTER`.
 */
export function play(game: Game | null, time: number, presses: number): Game | null {
  let next = game && time - game.last < IDLE_AFTER ? advance(game, time) : null;
  for (let n = 0; n < presses; n++) next = next ? press(next, time) : newGame(time);
  return next;
}
