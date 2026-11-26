import { describe, expect, it } from 'vitest';
import { chart, ending, GOOD, LEAD, PERFECT } from './chart';
import {
  advance,
  DEMO_WRAP,
  IDLE,
  LISTEN,
  multiplier,
  newGame,
  newStudio,
  phaseOf,
  settle,
  SIGNAL,
  tap,
} from './game';

const press = (x = 30, y = 60) => ({ x, y, down: true, presses: 1 });
const SIZE = 100;

describe('saying a word', () => {
  it('is perfect right on its beat, good a little off, and nothing far off', () => {
    const game = newGame(0, 1, true);
    tap(game, LEAD + PERFECT - 1);
    expect(game.hits[0]?.judge).toBe('perfect');
    const second = game.beats[1]?.at ?? 0;
    tap(game, second - GOOD + 1);
    expect(game.hits[1]?.judge).toBe('good');
    const third = game.beats[2]?.at ?? 0;
    tap(game, third - GOOD - 100);
    expect(game.hits[2]).toBeNull();
  });

  it('scores more with a combo, and raises the signal', () => {
    const game = newGame(0, 1, true);
    tap(game, LEAD);
    expect(game.score).toBe(100);
    expect(game.signal).toBeGreaterThan(SIGNAL);
    expect(multiplier(0)).toBe(1);
    expect(multiplier(4)).toBe(2);
    expect(multiplier(40)).toBe(4);
  });

  it('ignores a tap once every word is judged', () => {
    const game = newGame(0, 1, true);
    game.hits = game.hits.map((_, n) => ({ judge: 'miss' as const, at: n, held: 0 }));
    tap(game, LEAD);
    expect(game.score).toBe(0);
  });
});

describe('long words', () => {
  it('earn as much as was held, and end the hold when let go', () => {
    const game = newGame(0, 1, true);
    const long = game.beats.at(3) ?? { at: 0, hold: 1 };
    game.hits = game.hits.map((hit, n) =>
      n < 3 ? { judge: 'perfect' as const, at: 0, held: 0 } : hit,
    );
    tap(game, long.at);
    expect(game.holding).toBe(3);
    settle(game, long.at + long.hold / 2, false);
    expect(game.holding).toBeNull();
    expect(game.hits[3]?.held).toBeCloseTo(0.5);
  });

  it('let go at the end of the episode still count', () => {
    const game = newGame(0, 1, true);
    game.holding = 3;
    game.hits[3] = { judge: 'good', at: 0, held: 0 };
    game.signal = 0.01;
    game.hits[0] = null;
    settle(game, LEAD + GOOD + 1, true);
    expect(game.lost).toBe(true);
    expect(game.holding).toBeNull();
  });
});

describe('an episode', () => {
  it('misses the words let past, and is lost when the signal runs out', () => {
    const game = newGame(0, 1, true);
    for (const beat of game.beats.slice(0, 4)) settle(game, beat.at + GOOD + 1, false);
    expect(game.hits.slice(0, 4).every((hit) => hit?.judge === 'miss')).toBe(true);
    expect(game.lost).toBe(true);
    expect(phaseOf(game, game.ended ?? 0)).toBe('listen');
    expect(phaseOf(game, (game.ended ?? 0) + LISTEN)).toBe('wrap');
    settle(game, 99_999, false);
    expect(game.ended).toBeLessThan(99_999);
  });

  it('is recorded once its last word has gone by', () => {
    const game = newGame(0, 1, true);
    settle(game, ending(game.beats), false);
    expect(game.ended).toBe(ending(game.beats));
  });

  it('gets quicker each episode', () => {
    expect(ending(chart(2))).toBeLessThan(ending(chart(1)));
    expect(ending([])).toBe(0);
  });
});

describe('the studio', () => {
  it('plays a perfect demo by itself, and starts it again after its wrap-up', () => {
    let studio = newStudio(0);
    for (let time = 0; time <= ending(studio.game.beats); time += 50)
      studio = advance(studio, time, undefined, SIZE);
    expect(studio.game.hits.every((hit) => hit?.judge === 'perfect')).toBe(true);
    const ended = studio.game.ended ?? 0;
    studio = advance(studio, ended + LISTEN + DEMO_WRAP, undefined, SIZE);
    expect(studio.game.ended).toBeNull();
    expect(studio.best).toBe(0);
  });

  it('starts a visitor episode with a tap, and plays it', () => {
    let studio = advance(newStudio(0), 100, press(), SIZE);
    expect(studio.game.visitor).toBe(true);
    studio = advance(studio, 100 + LEAD, press(), SIZE);
    expect(studio.game.hits[0]?.judge).toBe('perfect');
  });

  it('cheers during the playback, keeps the best, and goes on to the next episode', () => {
    let studio = advance(newStudio(0), 0, press(), SIZE);
    studio.game.hits = studio.game.hits.map(() => ({ judge: 'perfect' as const, at: 0, held: 0 }));
    studio.game.score = 300;
    const end = ending(studio.game.beats);
    studio = advance(studio, end, undefined, SIZE);
    expect(studio.best).toBe(300);
    studio = advance(studio, end + 100, press(), SIZE);
    expect(studio.cheer).toBe(end + 100);
    studio = advance(studio, end + LISTEN + 100, press(), SIZE);
    expect(studio.game.episode).toBe(2);
  });

  it('goes back to episode 1 after a lost one, and to the host after a long wait', () => {
    let studio = advance(newStudio(0), 0, press(), SIZE);
    studio.game.lost = true;
    studio.game.ended = 10;
    studio = advance(studio, 10 + LISTEN, press(), SIZE);
    expect(studio.game.episode).toBe(1);
    expect(studio.game.visitor).toBe(true);
    studio.game.ended = 0;
    studio = advance(studio, LISTEN + IDLE, undefined, SIZE);
    expect(studio.game.visitor).toBe(false);
  });

  it('asks for the podcast when a tap lands on the Listen button, and does not play', () => {
    const studio = advance(newStudio(0), 0, press(88, 93), SIZE);
    expect(studio.open).toBe(0);
    expect(studio.game.visitor).toBe(false);
  });
});
