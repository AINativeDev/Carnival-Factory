import { describe, expect, it } from 'vitest';
import { drawingOf } from '../test-support/recording-canvas';
import { faceSign } from './name-board';
import { nameLines, SIGN_STYLES, SHRINK } from './sign-styles';
import { signFont } from './theme';

const width = (text: string) => text.length * 10;

describe('nameLines', () => {
  it('keeps a name that fits, or nearly fits, on one line', () => {
    expect(nameLines('Penguin Pond', 120, width)).toEqual(['Penguin Pond']);
    expect(nameLines('Penguin Pond', 120 / SHRINK + 1, width)).toEqual(['Penguin Pond']);
  });

  it('wraps a long name at the space nearest its middle', () => {
    expect(nameLines('North Pole Parcel Depot', 120, width)).toEqual([
      'North Pole',
      'Parcel Depot',
    ]);
    expect(nameLines('Spinning Top Workshop', 100, width)).toEqual(['Spinning Top', 'Workshop']);
  });

  it('leaves a single long word on one line, for the board to shrink', () => {
    expect(nameLines('Supercalifragilistic', 80, width)).toEqual(['Supercalifragilistic']);
  });
});

describe('sign styles', () => {
  it('letters each kind of square its own way', () => {
    const families = new Set(Object.values(SIGN_STYLES).map((style) => style.family));
    expect(families.size).toBeGreaterThanOrEqual(5);
    expect(signFont('serif', 12, true, true)).toMatch(/^italic bold 12px Georgia/);
    expect(signFont('sans', 10, false)).toMatch(/^normal 10px/);
  });

  it('puts a long name on two lines, in capitals where the style asks, over whose it is', () => {
    const face = { a: { x: 0, y: 0 }, b: { x: 160, y: 80 }, out: { x: -32, y: 16 } };
    const texts = drawingOf((ctx) => {
      faceSign(
        ctx,
        face,
        10,
        40,
        'North Pole Parcel Depot',
        'by @ana',
        0,
        { color: '#000', you: false },
        SIGN_STYLES.shed,
      );
    })
      .filter(([name]) => name === 'fillText')
      .map(([, text]) => text);
    expect(texts).toEqual(['NORTH POLE', 'PARCEL DEPOT', 'by @ana']);
  });
});
