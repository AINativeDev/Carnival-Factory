import { describe, expect, it } from 'vitest';
import attraction from './attraction';
import { cardOf, popText } from './cards';
import { DRIFT, FLIGHT, windAt } from './flight';
import { type Game, newGame, ROUND, ROUNDS } from './game';
import { goldShelf, paceOf, SHELVES, snowmanX } from './targets';
import { windWord } from './wind';

/** Stands in for the canvas and writes down the words drawn, so the booth can be drawn in Node. */
class DrawingLog {
  readonly words: string[] = [];
  fillStyle: unknown = '';
  strokeStyle: unknown = '';
  globalAlpha = 1;
  lineWidth = 1;
  lineCap = 'butt';
  font = '';
  textAlign = 'left';
  textBaseline = 'alphabetic';
  private readonly skip = () => undefined;
  fillText = (text: string) => {
    this.words.push(text);
  };
  save = this.skip;
  restore = this.skip;
  translate = this.skip;
  scale = this.skip;
  rotate = this.skip;
  beginPath = this.skip;
  closePath = this.skip;
  moveTo = this.skip;
  lineTo = this.skip;
  arc = this.skip;
  arcTo = this.skip;
  ellipse = this.skip;
  quadraticCurveTo = this.skip;
  roundRect = this.skip;
  fill = this.skip;
  stroke = this.skip;
  fillRect = this.skip;
  createLinearGradient = () => ({ addColorStop: this.skip });
}

const SIZE = 400;

/** The words the booth draws at `time`, with a tap at `x`, `y` in its 0 to 100 units if given. */
function wordsAt(time: number, x?: number, y?: number): string[] {
  const log = new DrawingLog();
  const pointer =
    x === undefined || y === undefined
      ? undefined
      : { x: (x / 100) * SIZE, y: (y / 100) * SIZE, down: true, presses: 1 };
  attraction.draw(log as unknown as CanvasRenderingContext2D, SIZE, time, pointer);
  return log.words;
}

/** Taps where shelf `n`'s snowman will be when a snowball thrown at `time` in round `round` lands. */
function throwAt(n: number, time: number, round: number): string[] {
  const shelf = SHELVES.at(n) ?? SHELVES[0];
  const x = snowmanX(n, time + FLIGHT, paceOf(round)) - windAt(round, time) * DRIFT;
  return wordsAt(time, x, shelf.y - 6);
}

describe('Snowball Toss', () => {
  it('stands on the map as a game stall, as it always has', () => {
    expect(attraction.id).toBe('snowball-toss');
    expect(attraction.name).toBe('Snowball Toss');
    expect(attraction.stall).toEqual({
      shape: 'stall',
      roof: 'pine',
      trim: 'snow',
      landmark: 'game-stall',
    });
  });

  it('plays three rounds through its scoreboard, combos, gold snowman and cards, then again', () => {
    expect(wordsAt(100_000)).toContain('Tap to throw');
    let time = 100_000;
    let seen: string[] = [];
    for (let round = 1; round <= ROUNDS; round++) {
      for (let k = 0; k < ROUND; k++) {
        time += 1_000;
        seen = [...seen, ...throwAt(k % 2 ? 2 : 1, time, round)];
        for (let t = time + 200; t < time + 1_000; t += 200) seen = [...seen, ...wordsAt(t)];
      }
      time += 1_000;
      const card = wordsAt(time);
      seen = [...seen, ...card];
      expect(card).toContain(round < ROUNDS ? `Round ${String(round)} done!` : 'New best!');
      time += 400;
      wordsAt(time, 50, 50);
    }
    expect(seen).toContain('COMBO ×2');
    expect(seen).toContain('GOLD');
    expect(seen.some((w) => w.startsWith('+') && w.endsWith('×3'))).toBe(true);
    expect(seen.some((w) => w.startsWith('WIND'))).toBe(true);
    expect(seen).toContain('Tap to play again');
    expect(wordsAt(time + 50)).toContain(`${String(ROUND)} left`);
  });

  it('aims where the pointer rests while a round is on', () => {
    const log = new DrawingLog();
    const hover = { x: 100, y: 100, down: false, presses: 0 };
    attraction.draw(log as unknown as CanvasRenderingContext2D, SIZE, 900_000, hover);
    expect(log.words).toContain('Tap to throw');
  });
});

describe('the words', () => {
  it('names the wind by its strength', () => {
    expect(windWord(0.05)).toBe('Calm');
    expect(windWord(-0.4)).toBe('Breeze');
    expect(windWord(0.9)).toBe('Strong');
  });

  it('pops a hit’s points, with its gold and multiplier', () => {
    const pop = { x: 0, y: 0, at: 0, points: 3, times: 1, gold: false };
    expect(popText(pop)).toBe('+3');
    expect(popText({ ...pop, points: 15, times: 3, gold: true })).toBe('GOLD +15 ×3');
  });

  it('says how a round went, and how the game went', () => {
    const game: Game = { ...newGame(0), round: 1, roundScore: 7, score: 7, ended: 0 };
    expect(cardOf(game).title).toBe('Round 1 done!');
    expect(cardOf(game).call).toBe('Tap for round 2: faster, windier');
    const over = { ...game, round: ROUNDS, score: 20, best: 30, bestBefore: 30 };
    expect(cardOf(over).title).toBe('Game over');
    expect(cardOf(over).lines).toEqual(['Score 20', 'Best of your visit 30']);
    expect(goldShelf(0, 1, 0)).toBe(-1);
  });
});
