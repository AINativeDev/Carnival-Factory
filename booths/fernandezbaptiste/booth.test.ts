import { describe, expect, it } from 'vitest';
import {
  advance,
  deal,
  ease,
  ELF,
  ELF_FLIP,
  ELF_QUICKEST,
  ELF_SPREAD,
  elfDelay,
  FLIGHT,
  FLIP_TIME,
  flipsAt,
  flip,
  FLIPS,
  GAME,
  IDLE_AFTER,
  isSnap,
  LOOP,
  makeDeck,
  momentAt,
  newGame,
  play,
  playUntilSnap,
  press,
  random,
  RANKS,
  REST,
  roundAt,
  shuffle,
  stacksAt,
  SUITS,
  TAKE,
  tally,
  TARGET,
  YOU,
} from './booth';
import type { Card, Game } from './booth';

const key = (card: Card) => `${card.rank}/${card.suit}`;

describe('the deck', () => {
  it('has every card once', () => {
    const deck = makeDeck();
    expect(deck).toHaveLength(RANKS * SUITS);
    expect(new Set(deck.map(key)).size).toBe(RANKS * SUITS);
  });

  it('shuffles the same way for the same seed, and keeps every card', () => {
    const deck = makeDeck();
    expect(shuffle(deck, 7)).toEqual(shuffle(deck, 7));
    expect(shuffle(deck, 7)).not.toEqual(shuffle(deck, 8));
    expect(shuffle(deck, 7).map(key).sort()).toEqual(deck.map(key).sort());
    expect(deck).toEqual(makeDeck());
  });

  it('draws random numbers from 0 to 1', () => {
    const next = random(42);
    for (let i = 0; i < 200; i++) {
      const n = next();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('deals one card at a time, the left elf first', () => {
    const deck = makeDeck();
    const [left, right] = deal(deck);
    expect(left).toHaveLength(deck.length / 2);
    expect(right).toHaveLength(deck.length / 2);
    expect(left[0]).toEqual(deck[0]);
    expect(right[0]).toEqual(deck[1]);
  });
});

describe('snap', () => {
  it('is two cards of the same rank on top of the pile', () => {
    expect(isSnap([{ rank: 3, suit: 0 }])).toBe(false);
    expect(
      isSnap([
        { rank: 3, suit: 0 },
        { rank: 3, suit: 2 },
      ]),
    ).toBe(true);
    expect(
      isSnap([
        { rank: 3, suit: 0 },
        { rank: 4, suit: 0 },
        { rank: 3, suit: 1 },
      ]),
    ).toBe(false);
  });

  it('takes turns until the pile shows a snap', () => {
    const left = [
      { rank: 1, suit: 0 },
      { rank: 4, suit: 0 },
    ];
    const right = [
      { rank: 2, suit: 0 },
      { rank: 4, suit: 1 },
    ];
    const { flips, snapped } = playUntilSnap([left, right], 1);
    expect(snapped).toBe(true);
    expect(flips.map((f) => f.player)).toEqual([1, 0, 1, 0]);
    expect(flips.at(-1)!.card).toEqual({ rank: 4, suit: 0 });
  });

  it('stops without a snap when a hand runs out', () => {
    const { flips, snapped } = playUntilSnap([[{ rank: 1, suit: 0 }], [{ rank: 2, suit: 0 }]], 0);
    expect(snapped).toBe(false);
    expect(flips).toHaveLength(2);
  });
});

describe('roundAt', () => {
  it('always ends in a snap on the last flip, with the elves taking turns', () => {
    for (let index = -20; index < 200; index++) {
      const round = roundAt(index);
      expect(round.flips).toHaveLength(FLIPS);
      const pile = round.flips.map((f) => f.card);
      expect(isSnap(pile)).toBe(true);
      for (let n = 2; n < FLIPS; n++) expect(isSnap(pile.slice(0, n))).toBe(false);
      round.flips.forEach((f, n) => expect(f.player).toBe((round.first + n) % 2));
    }
  });

  it('is the same every time, and alternates who starts', () => {
    expect(roundAt(12)).toEqual(roundAt(12));
    expect(roundAt(12).first).toBe(0);
    expect(roundAt(13).first).toBe(1);
  });

  it('lets both elves win rounds', () => {
    const winners = new Set(Array.from({ length: 40 }, (_, i) => roundAt(i).winner));
    expect(winners).toEqual(new Set([0, 1]));
  });
});

describe('tally', () => {
  it('counts the rounds won so far in this game, starting again each game', () => {
    expect(tally(0)).toEqual([0, 0]);
    expect(tally(GAME)).toEqual([0, 0]);
    const [a, b] = tally(GAME - 1, true);
    expect(a + b).toBe(GAME);
    const before = tally(3);
    const after = tally(3, true);
    const gained = roundAt(3).winner === 0 ? [1, 0] : [0, 1];
    expect(after).toEqual([before[0] + gained[0], before[1] + gained[1]]);
  });
});

describe('momentAt', () => {
  it('deals, flips, slaps, cheers, collects and gathers, in that order', () => {
    const stages = [500, 3_000, 7_800, 9_000, 10_500, 11_500].map((t) => momentAt(t).stage);
    expect(stages).toEqual(['deal', 'flip', 'slap', 'cheer', 'collect', 'gather']);
  });

  it('counts rounds, before the page loaded too', () => {
    expect(momentAt(LOOP * 3 + 10).index).toBe(3);
    expect(momentAt(-1).index).toBe(-1);
    expect(momentAt(-1)).toEqual({ ...momentAt(LOOP - 1), index: -1 });
  });

  it('keeps progress between 0 and 1', () => {
    for (let t = 0; t < LOOP; t += 41) {
      const { progress } = momentAt(t);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThan(1);
    }
  });
});

describe('flipsAt', () => {
  it('lands one card after another, each flying for a moment first', () => {
    const start = 1_000;
    expect(flipsAt(momentAt(start + 10))).toEqual({ landed: 0, flying: expect.any(Number) });
    expect(flipsAt(momentAt(start + FLIGHT + 10))).toEqual({ landed: 1, flying: null });
    expect(flipsAt(momentAt(start + FLIP_TIME + 10)).landed).toBe(1);
    expect(flipsAt(momentAt(start + FLIPS * FLIP_TIME - 10)).landed).toBe(FLIPS);
    expect(flipsAt(momentAt(9_000))).toEqual({ landed: FLIPS, flying: null });
    expect(flipsAt(momentAt(100))).toEqual({ landed: 0, flying: null });
  });
});

describe('stacksAt', () => {
  const whole = RANKS * SUITS;
  const count = (t: number) => {
    const moment = momentAt(t);
    const { hands, deck } = stacksAt(moment, roundAt(moment.index));
    return { hands, deck, onTable: hands[0] + hands[1] + deck };
  };

  it('deals the whole deck out, and gathers it back by the end of the round', () => {
    expect(count(0)).toEqual({ hands: [0, 0], deck: whole, onTable: whole });
    expect(count(999).deck).toBeLessThan(2);
    expect(count(LOOP - 1).deck).toBeGreaterThan(whole - 2);
  });

  it('takes each flipped card from its elf, and gives the pile to the winner', () => {
    const round = roundAt(0);
    expect(count(7_800).onTable).toBe(whole - FLIPS);
    const [left, right] = count(11_000).hands;
    expect(round.winner === 0 ? left > right : right > left).toBe(true);
    expect(left + right).toBe(whole);
  });
});

describe('ease', () => {
  it('is slow at both ends and clamped', () => {
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
    expect(ease(0.5)).toBe(0.5);
  });
});

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
