import { describe, expect, it } from 'vitest';
import theFactory from './attraction';
import { END_HERO, SKIP } from './buttons';
import type { Button } from './buttons';
import { needFor, CARDS, cardTop } from './rules';
import { END_GUARD } from './show';
import { LOOP_ROWS, SKILL_CARDS, TOUR_STEPS } from './tour-copy';

const SIZE = 200;

/** A stand-in canvas that writes down the words drawn on it and does nothing else. */
class WordsOnly {
  readonly texts: string[] = [];
  fillStyle: unknown = '';
  strokeStyle: unknown = '';
  lineWidth = 1;
  globalAlpha = 1;
  font = '';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  private readonly nothing = () => undefined;
  save = this.nothing;
  restore = this.nothing;
  scale = this.nothing;
  translate = this.nothing;
  rotate = this.nothing;
  fillRect = this.nothing;
  beginPath = this.nothing;
  closePath = this.nothing;
  arc = this.nothing;
  ellipse = this.nothing;
  fill = this.nothing;
  stroke = this.nothing;
  moveTo = this.nothing;
  lineTo = this.nothing;
  quadraticCurveTo = this.nothing;
  roundRect = this.nothing;
  clip = this.nothing;
  drawImage = this.nothing;
  measureText = () => ({ width: 10 });
  createLinearGradient = () => ({ addColorStop: this.nothing });
  fillText = (text: string) => {
    this.texts.push(text);
  };
}

/** A fresh stand-in canvas, as the drawing code takes it, and the words drawn on it. */
function canvas() {
  const stand = new WordsOnly();
  return { ctx: stand as unknown as CanvasRenderingContext2D, texts: stand.texts };
}

/** A press at `x`, `y` in the drawing's 0 to 100 units. */
const press = (x: number, y: number) => ({
  x: (x * SIZE) / 100,
  y: (y * SIZE) / 100,
  down: true,
  presses: 1,
});

/** A press in the middle of `button`. */
const on = (button: Button) =>
  press(button.box.x + button.box.w / 2, button.box.y + button.box.h / 2);

describe('The Factory', () => {
  it('stands on the map as its tower, spelling TESSL', () => {
    expect(theFactory.id).toBe('the-factory');
    expect(theFactory.stall?.landmark).toBe('tower');
    expect(theFactory.stall?.letters).toBe('TESSL');
  });

  it('waits on its tour for taps, then leads into the game, asking nothing', () => {
    const factory = theFactory;
    const { ctx, texts } = canvas();
    for (let t = 0; t <= 30_000; t += 400) factory.draw(ctx, SIZE, t);
    expect(texts).toContain('Tap or → to start');
    expect(texts).not.toContain(TOUR_STEPS[1]?.title);
    let t = 30_040;
    // Long enough on each step for its scene to run through every skill and every loop.
    for (let step = 1; step <= TOUR_STEPS.length; step++) {
      factory.draw(ctx, SIZE, t, press(40, 60));
      for (const end = t + 11_000; t <= end; t += 40) factory.draw(ctx, SIZE, t);
    }
    for (const step of TOUR_STEPS)
      expect(texts).toEqual(expect.arrayContaining([step.title, ...step.lines]));
    for (const card of SKILL_CARDS)
      expect(texts).toEqual(expect.arrayContaining([card.folder, card.does]));
    for (const row of LOOP_ROWS)
      expect(texts).toEqual(expect.arrayContaining([row.when, row.loop, row.skill, row.then]));
    expect(texts).toEqual(expect.arrayContaining(['ASSESS', 'CHECKS', 'MERGE', 'Next ▶']));
    expect(texts).toEqual(expect.arrayContaining(['Skip to the game ▶', 'Feed the loop ▶']));
    expect(texts).toEqual(expect.arrayContaining(['Tap to play ▶', 'REQUEST', 'MERGE']));
    expect(factory.ask?.()).toBeUndefined();
  });

  it('steps through its tour with the keys', () => {
    const { ctx, texts } = canvas();
    theFactory.draw(ctx, SIZE, 0);
    theFactory.draw(ctx, SIZE, 10, undefined, ['right']);
    expect(texts).toContain(TOUR_STEPS[1]?.title);
    expect(texts).toContain('Tap or → to go on');
  });

  it('skips to the game, plays a round to its end card, and asks for a booth once', () => {
    // Time running back to 0 starts the show afresh.
    const factory = theFactory;
    const { ctx, texts } = canvas();
    factory.draw(ctx, SIZE, 0);
    factory.draw(ctx, SIZE, 10, on(SKIP));
    factory.draw(ctx, SIZE, 20, press(CARDS.x + 1, cardTop(0) + 1));
    factory.draw(ctx, SIZE, 60, press(CARDS.x + 1, cardTop(needFor(0)) + 1));
    let t = 100;
    for (; t <= 20_000; t += 40) factory.draw(ctx, SIZE, t);
    expect(texts).toEqual(expect.arrayContaining(['SCORE', '+20', 'JAM!', 'Sign up for Tessl ↗']));
    expect(texts).not.toContain('KEEP IN TOUCH');
    expect(texts).toEqual(expect.arrayContaining(['Loop complete', 'Ask for a booth ↗']));
    expect(texts).toEqual(expect.arrayContaining(['Learn how in the Academy →', 'Keep in touch:']));
    expect(texts).toEqual(expect.arrayContaining(['AI DevCon ↗', 'Blog ↗', 'Podcast ↗']));
    factory.draw(ctx, SIZE, t + END_GUARD, on(END_HERO));
    expect(factory.ask?.()).toEqual({ open: 1 });
    expect(factory.ask?.()).toBeUndefined();
  });
});
