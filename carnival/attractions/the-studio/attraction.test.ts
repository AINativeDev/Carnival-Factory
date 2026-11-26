import { describe, expect, it } from 'vitest';
import theStudio from './attraction';
import { buttonsFor, linkAt, LINKS } from './buttons';
import { chart, pace, TRAVEL, WORDS } from './chart';
import { CHEER, ease, FADE, hop, pop } from './cues';
import { newGame, LISTEN } from './game';
import { accuracy, grade, voice, waveOf, wobble } from './score';
import { played } from './wrap';

/** A stand-in canvas context that takes every call the studio makes and draws nothing. */
const nothing = () => undefined;
const quiet = {
  ...{ save: nothing, restore: nothing, scale: nothing, translate: nothing, rotate: nothing },
  ...{ beginPath: nothing, closePath: nothing, moveTo: nothing, lineTo: nothing, arc: nothing },
  ...{ arcTo: nothing, ellipse: nothing, quadraticCurveTo: nothing, rect: nothing, clip: nothing },
  ...{ fill: nothing, stroke: nothing, fillRect: nothing, fillText: nothing },
  measureText: () => ({ width: 40 }),
  createLinearGradient: () => ({ addColorStop: nothing }),
} as unknown as CanvasRenderingContext2D;

describe('the studio', () => {
  it('keeps its id, name and the studio landmark', () => {
    expect(theStudio.id).toBe('the-studio');
    expect(theStudio.name).toBe('The Recording Studio');
    expect(theStudio.stall?.landmark).toBe('studio');
  });

  it('draws through a whole demo episode without throwing', () => {
    for (let time = 0; time < 40_000; time += 250) theStudio.draw(quiet, 300, time);
    expect(theStudio.ask?.()).toBeUndefined();
  });

  it('asks for the podcast once, on the frame its Listen button is tapped', () => {
    theStudio.draw(quiet, 200, 50_000, { x: 176, y: 186, down: true, presses: 1 });
    expect(theStudio.ask?.()).toEqual({ open: LINKS.podcast });
    expect(theStudio.ask?.()).toBeUndefined();
  });
});

describe('the buttons', () => {
  it('finds the link under a tap, or none', () => {
    const card = buttonsFor('wrap');
    for (const b of card) expect(linkAt(card, b.x + 1, b.y + 1)).toBe(b.link);
    expect(card.map((b) => b.link)).toEqual([LINKS.podcast, LINKS.youtube]);
    expect(linkAt(buttonsFor('record'), 10, 10)).toBeNull();
    expect(linkAt(buttonsFor('listen'), 90, 93)).toBe(LINKS.podcast);
  });
});

describe('the chart', () => {
  it('has its words, every fourth one long, coming closer together', () => {
    const beats = chart(1);
    expect(beats).toHaveLength(WORDS);
    expect(beats.filter((beat) => beat.hold > 0)).toHaveLength(WORDS / 4 - 0.5);
    expect(TRAVEL).toBeGreaterThan(1_000);
    expect(pace(1)).toBe(1);
    expect(pace(50)).toBeCloseTo(0.55);
  });
});

describe('the cues', () => {
  it('ease, hop and pop smoothly, without jumps', () => {
    expect(ease(-1)).toBe(0);
    expect(ease(0.5)).toBeCloseTo(0.5);
    expect(ease(2)).toBe(1);
    expect(FADE).toBeLessThan(1_000);
    expect(hop(0, CHEER / 2)).toBeCloseTo(1);
    expect(hop(0, CHEER * 2)).toBe(0);
    expect(pop(0)).toBe(0);
    expect(pop(1)).toBeCloseTo(1);
  });
});

describe('the score', () => {
  it('grades a perfect episode top, an empty one bottom, and a lost one as lost', () => {
    const game = newGame(0, 1, true);
    expect(grade(game).letter).toBe('C');
    game.hits = game.hits.map(() => ({ judge: 'perfect' as const, at: 0, held: 1 }));
    expect(accuracy(game)).toBe(1);
    expect(grade(game).letter).toBe('S');
    game.hits = game.hits.map((hit, n) =>
      n < 4 ? { judge: 'miss' as const, at: 0, held: 0 } : hit,
    );
    expect(grade(game).letter).toBe('A');
    game.hits = game.hits.map((hit, n) =>
      n >= 12 ? { judge: 'good' as const, at: 0, held: 0 } : hit,
    );
    expect(grade(game).letter).toBe('B');
    game.lost = true;
    expect(grade(game).title).toBe('Signal lost!');
    expect(accuracy({ ...game, beats: [] })).toBe(0);
  });

  it('plays back loud where words were said and quiet where they were missed', () => {
    const game = newGame(0, 1, true);
    game.ended = 30_000;
    const quietWave = Math.max(...waveOf(game));
    game.hits = game.hits.map(() => ({ judge: 'perfect' as const, at: 0, held: 1 }));
    expect(quietWave).toBeLessThan(0.2);
    expect(Math.max(...waveOf(game))).toBeGreaterThan(0.7);
    expect(played(game, 30_000 + LISTEN / 2)).toBeCloseTo(0.5);
    expect(played(newGame(0, 1, true), 10)).toBe(0);
    expect(wobble(3)).toBe(wobble(3));
  });

  it('rings out a word just said, and stays loud on a long word held', () => {
    const game = newGame(0, 1, true);
    game.hits[0] = { judge: 'perfect', at: 1_000, held: 0 };
    expect(voice(game, 1_000)).toBe(1);
    expect(voice(game, 2_000)).toBe(0);
    game.holding = 3;
    expect(voice(game, 2_000)).toBe(0.8);
  });
});
