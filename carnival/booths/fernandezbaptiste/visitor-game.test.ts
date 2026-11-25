import { describe, expect, it } from 'vitest';
import { RANKS, SUITS } from './deck';
import type { Card } from './deck';
import { FLIGHT } from './round-clock';
import {
  advance,
  ELF,
  ELF_FLIP,
  ELF_QUICKEST,
  ELF_SPREAD,
  elfDelay,
  flip,
  IDLE_AFTER,
  newGame,
  play,
  press,
  REST,
  TAKE,
  TARGET,
  YOU,
} from './visitor-game';
import type { Game } from './visitor-game';

/** A game at time 0 with these hands and an empty pile, `turn` to flip. */
function gameWith(hands: [Card[], Card[]], turn = ELF, score: [number, number] = [0, 0]): Game {
  return { ...newGame(0), hands, turn, score };
}

const card = (rank: number, suit = 0): Card => ({ rank, suit });

describe('a new game', () => {
  it('deals the whole deck from the time, and the elf flips first', () => {
    const game = newGame(1234);
    expect(game.hands[0]).toHaveLength((RANKS * SUITS) / 2);
    expect(game.hands[1]).toHaveLength((RANKS * SUITS) / 2);
    expect(game).toEqual(newGame(1234));
    expect(game.turn).toBe(ELF);
    expect(game.score).toEqual([0, 0]);
    expect(game.phase).toBe('turn');
  });
});

describe('turns', () => {
  it('lets the elf flip on its own once it has waited', () => {
    const game = gameWith([[card(1), card(2)], [card(3)]]);
    expect(advance(game, ELF_FLIP - 1)).toBe(game);
    const next = advance(game, ELF_FLIP);
    expect(next.pile).toEqual([card(1)]);
    expect(next.hands[0]).toEqual([card(2)]);
    expect(next.turn).toBe(YOU);
    expect(next.flipped).toEqual({ at: ELF_FLIP, player: ELF });
  });

  it('waits for the visitor to tap on their turn, however long', () => {
    const game = gameWith([[card(1)], [card(3), card(4)]], YOU);
    expect(advance(game, 60_000)).toBe(game);
    const next = press(game, 100);
    expect(next.pile).toEqual([card(3)]);
    expect(next.hands[1]).toEqual([card(4)]);
    expect(next.turn).toBe(ELF);
  });

  it("ignores a tap on the elf's turn", () => {
    const game = gameWith([[card(1)], [card(3)]]);
    const next = press(game, 100);
    expect(next.pile).toEqual([]);
    expect(next.turn).toBe(ELF);
    expect(next.last).toBe(100);
  });

  it('deals again when a player has no cards left to flip', () => {
    const game = gameWith([[], [card(3)]]);
    const next = flip(game, 0);
    expect(next.pile).toHaveLength(1);
    expect(next.hands[0].length + next.hands[1].length).toBe(RANKS * SUITS - 1);
    expect(next.deals).toBe(game.deals + 1);
  });
});

describe('slapping a snap', () => {
  // The elf's card is down, and the visitor's matching card makes the snap.
  const snap = () =>
    press({ ...gameWith([[card(5)], [card(2, 2)]], YOU, [3, 4]), pile: [card(2, 1)] }, 0);

  it('spots a snap when the two top cards match', () => {
    const game = snap();
    expect(game.phase).toBe('snap');
    expect(game.elfSlap).toBe(elfDelay(0));
  });

  it('gives the pile to the visitor when they tap before the elf', () => {
    const game = snap();
    const next = press(advance(game, game.elfSlap - 1), game.elfSlap - 1);
    expect(next.phase).toBe('won');
    expect(next.winner).toBe(YOU);
    expect(next.score).toEqual([3, 5]);
  });

  it('gives the pile to the elf when the visitor is too slow', () => {
    const game = snap();
    const next = press(advance(game, game.elfSlap), game.elfSlap);
    expect(next.winner).toBe(ELF);
    expect(next.score).toEqual([4, 4]);
  });

  it('puts the won pile under its winner’s hand once it has gone over', () => {
    const game = snap();
    const won = advance(game, game.elfSlap);
    expect(won.phase).toBe('won');
    const next = advance(won, game.elfSlap + TAKE);
    expect(next.phase).toBe('turn');
    expect(next.pile).toEqual([]);
    expect(next.hands[0]).toEqual([card(5), card(2, 1), card(2, 2)]);
  });

  it('makes the elf wait a short, slightly random time, the same for the same moment', () => {
    const delays = Array.from({ length: 50 }, (_, n) => elfDelay(n * 977));
    for (const delay of delays) {
      expect(delay).toBeGreaterThanOrEqual(FLIGHT + ELF_QUICKEST);
      expect(delay).toBeLessThan(FLIGHT + ELF_QUICKEST + ELF_SPREAD);
    }
    expect(new Set(delays).size).toBeGreaterThan(10);
    expect(elfDelay(977)).toBe(elfDelay(977));
  });
});

describe('winning', () => {
  const nearlyWon = () => {
    const game = gameWith([[card(2, 1)], [card(2, 2), card(5)]], YOU, [7, TARGET - 1]);
    return press({ ...game, pile: [card(2, 1)] }, 0);
  };

  it(`ends the game when someone has won ${TARGET} piles`, () => {
    const won = press(nearlyWon(), 10);
    const over = advance(won, 10 + TAKE);
    expect(over.phase).toBe('over');
    expect(over.winner).toBe(YOU);
    expect(over.score).toEqual([7, TARGET]);
    expect(advance(over, 60_000)).toBe(over);
  });

  it('starts a new game on a tap, but not on a late slap', () => {
    const over = advance(press(nearlyWon(), 10), 10 + TAKE);
    expect(press(over, over.since + REST - 1).phase).toBe('over');
    const next = press(over, over.since + REST);
    expect(next.phase).toBe('turn');
    expect(next.score).toEqual([0, 0]);
  });
});

describe('play', () => {
  it('lets the elves play each other until someone taps', () => {
    expect(play(null, 5_000, 0)).toBeNull();
    expect(play(null, 5_000, 1)).toEqual(newGame(5_000));
  });

  it('counts every tap in a frame', () => {
    const game = gameWith([[card(1)], [card(3), card(4), card(5)]], YOU);
    expect(play(game, 0, 1)?.pile).toHaveLength(1);
    // The second tap is on the elf's turn, so only one card is flipped.
    expect(play(game, 0, 2)?.pile).toHaveLength(1);
    const snapping = gameWith([[card(1)], [card(3, 1), card(5)]], YOU);
    const snapped = play({ ...snapping, pile: [card(3, 2)] }, 0, 2);
    expect(snapped?.phase).toBe('won');
    expect(snapped?.winner).toBe(YOU);
  });

  it('goes back to the elves playing each other once the visitor has gone quiet', () => {
    const game = gameWith([[card(1)], [card(3)]], YOU);
    expect(play(game, IDLE_AFTER - 1, 0)).not.toBeNull();
    expect(play(game, IDLE_AFTER, 0)).toBeNull();
  });

  it('plays a whole game to the end with a quick visitor', () => {
    let game: Game | null = null;
    let time = 0;
    for (; time < 600_000 && game?.phase !== 'over'; time += 50) {
      game = play(game, time, time % 400 === 0 ? 1 : 0);
    }
    expect(game?.phase).toBe('over');
    expect(Math.max(...(game?.score ?? [0]))).toBe(TARGET);
  });
});
