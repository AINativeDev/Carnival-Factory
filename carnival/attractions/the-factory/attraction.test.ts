import { describe, expect, it } from 'vitest';
import theFactory, { BELT, cogTurn, LETTERS, PUFF, parcelAt, puffAt, puffSpot } from './attraction';

describe('puffAt', () => {
  it('rises from the chimney and starts again, each puff in turn', () => {
    expect(puffAt(0, 0)).toBe(0);
    expect(puffAt(PUFF / 2, 0)).toBeCloseTo(0.5);
    expect(puffAt(PUFF, 0)).toBeCloseTo(0);
    expect(puffAt(0, 1)).toBeCloseTo(1 / 3);
  });
});

describe('parcelAt', () => {
  it('rides the belt from the door to the end, two parcels apart', () => {
    expect(parcelAt(0, 0)).toBe(0);
    expect(parcelAt(BELT / 4, 0)).toBeCloseTo(0.25);
    expect(parcelAt(0, 1)).toBeCloseTo(0.5);
  });
});

describe('puffSpot', () => {
  it('keeps every puff inside the square until it has faded', () => {
    for (let t = 0; t <= 1; t += 0.05) {
      const { y, r } = puffSpot(t);
      expect(y - r).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('cogTurn', () => {
  it('turns once every twelve seconds', () => {
    expect(cogTurn(6_000)).toBeCloseTo(Math.PI);
  });
});

describe('the drawing', () => {
  it('spells TESSL down the tower in gold letters', () => {
    const texts: unknown[] = [];
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
          'bezierCurveTo',
          'rect',
          'clip',
          'strokeRect',
          'setTransform',
          'transform',
        ].map((name) => [name, noop]),
      ),
      fillText: (text: unknown) => texts.push(text),
      measureText: () => ({ width: 10 }),
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
    } as unknown as CanvasRenderingContext2D;
    theFactory.draw(ctx, 200, 1_000);
    expect(texts).toEqual(expect.arrayContaining(LETTERS));
  });
});
