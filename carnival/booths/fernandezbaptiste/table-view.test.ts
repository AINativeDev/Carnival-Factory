import { describe, expect, it } from 'vitest';
import { other, RANKS, seat, SUITS } from './deck';
import type { Card } from './deck';
import { FLIGHT, FLIP_TIME, LOOP } from './round-clock';
import { FLIPS, roundAt } from './rounds';
import { gameView, idleView } from './table-view';
import { ELF, ELF_QUICKEST, newGame, REST, TAKE, YOU } from './visitor-game';
import type { Game } from './visitor-game';

const card = (rank: number, suit = 0): Card => ({ rank, suit });

/** A visitor's game at time 0, changed by `changes`. */
function gameWith(changes: Partial<Game>): Game {
  return { ...newGame(0), ...changes };
}

describe('the elves playing each other', () => {
  it('deals from the deck with nothing on the pile', () => {
    const view = idleView(500, false);
    expect(view.pile).toEqual([]);
    expect(view.stacks[0] + view.stacks[1] + view.deck).toBe(RANKS * SUITS);
    expect(view.bubble).toBeNull();
    expect(view.hint).toBeNull();
  });

  it('flips the round its cards in turn, each one through the air first', () => {
    const round = roundAt(0);
    const half = idleView(1_000 + FLIGHT / 2, false);
    expect(half.pile).toEqual([round.flips[0]?.card]);
    expect(half.flying).toBeCloseTo(0.5);
    expect(half.flipper).toBe(round.first);
    const landed = idleView(1_000 + FLIGHT + 1, false);
    expect(landed.flying).toBeNull();
  });

  it('has the winner reach the pile first and call SNAP', () => {
    const round = roundAt(0);
    const view = idleView(1_000 + FLIPS * FLIP_TIME + 200, false);
    expect(view.pile).toHaveLength(FLIPS);
    expect(seat(view.reach, round.winner)).toBeGreaterThan(seat(view.reach, other(round.winner)));
    expect(view.bubble).toMatchObject({ who: round.winner, text: 'SNAP!' });
  });

  it('lets the winner cheer, then slides the pile to them', () => {
    const round = roundAt(0);
    expect(idleView(9_000, false).cheer?.who).toBe(round.winner);
    const collect = idleView(10_500, false);
    expect(collect.cheer).toBeNull();
    expect(collect.slide).toBeGreaterThan(0);
    expect(collect.taker).toBe(round.winner);
    expect(seat(collect.chips, round.winner)).toBeGreaterThan(0);
    expect(idleView(11_500, false).pile).toEqual([]);
  });

  it('invites a hovering visitor to play, and never keeps a score', () => {
    expect(idleView(LOOP + 500, true).hint).toBe('Tap to play Snap');
    expect(idleView(LOOP + 500, true).score).toBeNull();
  });
});

describe("the visitor's game", () => {
  it('shows the hands, the score and a card in the air', () => {
    const game = gameWith({
      hands: [[card(1)], [card(2), card(3)]],
      pile: [card(4)],
      score: [2, 3],
      flipped: { at: 0, player: ELF },
      turn: YOU,
    });
    const view = gameView(game, FLIGHT / 4);
    expect(view.stacks).toEqual([1, 2]);
    expect(view.deck).toBe(0);
    expect(view.flying).toBeCloseTo(0.25);
    expect(view.score).toEqual([2, 3]);
    expect(view.chips).toEqual([2, 3]);
    expect(view.hint).toBeNull();
    expect(gameView(game, FLIGHT).flying).toBeNull();
    expect(gameView(game, FLIGHT).hint).toBe('Your turn: tap');
  });

  it("reaches the elf's hand for a snap", () => {
    const game = gameWith({ phase: 'snap', elfSlap: 1_000 });
    expect(gameView(game, 1_000 - ELF_QUICKEST).reach[0]).toBe(0);
    expect(gameView(game, 1_000).reach[0]).toBe(1);
    expect(gameView(game, 1_000).flipper).toBe(ELF);
  });

  it('slides a won pile to its winner with a SNAP', () => {
    const game = gameWith({ phase: 'won', since: 0, winner: YOU });
    const view = gameView(game, TAKE / 2);
    expect(view.slide).toBeGreaterThan(0);
    expect(view.taker).toBe(YOU);
    expect(view.bubble).toMatchObject({ who: YOU, text: 'SNAP!' });
  });

  it('cheers the winner of the game and sulks the loser, then offers another', () => {
    const won = gameView(gameWith({ phase: 'over', since: 0, winner: YOU }), 0);
    expect(won.bubble?.text).toBe('You win!');
    expect(won.cheer?.who).toBe(YOU);
    expect(won.sulk).toBe(ELF);
    expect(won.hint).toBeNull();
    const lost = gameView(gameWith({ phase: 'over', since: 0, winner: ELF }), REST);
    expect(lost.bubble?.text).toBe('I win!');
    expect(lost.hint).toBe('Tap to play again');
  });
});
