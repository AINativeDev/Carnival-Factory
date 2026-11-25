import { describe, expect, it } from 'vitest';
import { drawingOf } from '../test-support/recording-canvas';
import { prism } from './stall-volumes';

/** A diamond on screen, as a square tile looks from the isometric camera, clockwise. */
const DIAMOND = [
  { x: 0, y: -10 },
  { x: 20, y: 0 },
  { x: 0, y: 10 },
  { x: -20, y: 0 },
];

/** The colours a drawing fills with, in order, which say which sides it drew and lit. */
const fills = (ground: typeof DIAMOND) =>
  drawingOf((ctx) => {
    prism(ctx, ground, 12, undefined, 'lit', 'shaded');
  })
    .filter(([name]) => name === '=fillStyle')
    .map(([, color]) => String(color))
    .sort();

describe('the upright walls of a stall', () => {
  it('draws the two sides facing us, one lit and one shaded', () => {
    expect(fills(DIAMOND)).toEqual(['lit', 'shaded']);
  });

  it('draws the same sides whichever way round its outline goes', () => {
    expect(fills([...DIAMOND].reverse())).toEqual(fills(DIAMOND));
  });
});
