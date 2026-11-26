import { describe, expect, it } from 'vitest';
import theFactory from './attraction';
import { needFor, SIGN_UP, CARDS, cardTop } from './rules';

const SIZE = 200;

/** A canvas that does nothing but keep the words drawn on it. */
function fakeCanvas() {
  const texts: string[] = [];
  const gradient = { addColorStop: () => undefined };
  const noop = () => undefined;
  const ctx = {
    ...Object.fromEntries(
      [
        'save',
        'restore',
        'scale',
        'translate',
        'rotate',
        'fillRect',
        'beginPath',
        'closePath',
        'arc',
        'ellipse',
        'fill',
        'stroke',
        'moveTo',
        'lineTo',
        'quadraticCurveTo',
        'roundRect',
        'clip',
        'drawImage',
      ].map((name) => [name, noop]),
    ),
    fillText: (text: string) => texts.push(text),
    createLinearGradient: () => gradient,
  } as unknown as CanvasRenderingContext2D;
  return { ctx, texts };
}

/** A press at `x`, `y` in the drawing's 0 to 100 units. */
const press = (x: number, y: number) => ({
  x: (x * SIZE) / 100,
  y: (y * SIZE) / 100,
  down: true,
  presses: 1,
});

describe('The Factory', () => {
  it('stands on the map as its tower, spelling TESSL', () => {
    expect(theFactory.stall?.landmark).toBe('tower');
    expect(theFactory.stall?.letters).toBe('TESSL');
  });

  it('runs its demo with nobody playing, inviting a tap', () => {
    const { ctx, texts } = fakeCanvas();
    for (let t = 0; t <= 12_000; t += 40) theFactory.draw(ctx, SIZE, t);
    expect(texts).toEqual(expect.arrayContaining(['T', 'E', 'S', 'L', 'TAP TO PLAY', 'REQUEST']));
    expect(texts).toEqual(expect.arrayContaining(['MERGE', 'BOOTH!', 'Sign up for Tessl']));
    expect(theFactory.ask?.()).toBeUndefined();
  });

  it('plays a round to its last card, with the score and the big sign-up button', () => {
    const { ctx, texts } = fakeCanvas();
    // Time runs back to 0, which starts a fresh game; the first tap starts a round.
    theFactory.draw(ctx, SIZE, 0);
    theFactory.draw(ctx, SIZE, 10, press(CARDS.x + 1, cardTop(0) + 1));
    const right = needFor(0);
    theFactory.draw(ctx, SIZE, 50, press(CARDS.x + 1, cardTop(right) + 1));
    for (let t = 90; t <= 20_000; t += 40) theFactory.draw(ctx, SIZE, t);
    expect(texts).toEqual(expect.arrayContaining(['SCORE', '+20', 'JAM!', 'LOOP COMPLETE']));
    expect(texts).toEqual(expect.arrayContaining(['Tap anywhere else to play again']));
  });

  it('asks the page to open its sign-up link once, on the frame its button is tapped', () => {
    const { ctx } = fakeCanvas();
    theFactory.draw(ctx, SIZE, 0);
    theFactory.draw(ctx, SIZE, 20, press(SIGN_UP.corner.x + 3, SIGN_UP.corner.y + 3));
    expect(theFactory.ask?.()).toEqual({ open: 0 });
    expect(theFactory.ask?.()).toBeUndefined();
  });
});
