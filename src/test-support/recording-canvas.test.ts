import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from './recording-canvas';

describe('drawingOf: every canvas call a drawing makes, in order', () => {
  it('records calls and property settings, with numbers rounded so float noise never counts', () => {
    const calls = drawingOf((ctx) => {
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(10, 20.0000001, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    expect(calls).toEqual([
      ['=fillStyle', 'red'],
      ['beginPath'],
      ['arc', 10, 20, 5, 0, 6.283185],
      ['fill'],
    ]);
  });

  it('gives gradients and patterns names, and records what is done to them', () => {
    const calls = drawingOf((ctx) => {
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 9);
      glow.addColorStop(0, 'gold');
      ctx.fillStyle = glow;
      ctx.createPattern(null as never, 'repeat');
    });
    expect(calls).toEqual([
      ['createRadialGradient', 0, 0, 1, 0, 0, 9],
      ['gradient-0.addColorStop', 0, 'gold'],
      ['=fillStyle', 'gradient-0'],
      ['createPattern', null, 'repeat'],
    ]);
  });

  it('answers the questions drawings ask: text widths, the transform and state it set', () => {
    const answers = drawingOf((ctx) => {
      ctx.lineWidth = 3;
      const width = ctx.measureText('Ho ho').width;
      const { a } = ctx.getTransform();
      ctx.fillText(`${width} ${a} ${ctx.lineWidth}`, 0, 0);
      ctx.isPointInPath(1, 1);
    });
    expect(answers.at(-2)).toEqual(['fillText', '30 1 3', 0, 0]);
    expect(answers).toContainEqual(['measureText', 'Ho ho']);
  });
});

describe('drawingOf with things it did not make', () => {
  it('records an object it never named, such as an image, as it is', () => {
    const sprite = { width: 4, height: 4 };
    expect(
      drawingOf((ctx) => {
        ctx.drawImage(sprite as never, 1, 2);
      }),
    ).toEqual([['drawImage', sprite, 1, 2]]);
  });
});

describe('fingerprint', () => {
  it('tells two drawings apart by a single call, and the same drawing always the same', () => {
    const one = drawingOf((ctx) => {
      ctx.fillRect(0, 0, 10, 10);
    });
    const again = drawingOf((ctx) => {
      ctx.fillRect(0, 0, 10, 10);
    });
    const moved = drawingOf((ctx) => {
      ctx.fillRect(0, 0, 10, 10.01);
    });
    expect(fingerprint(one)).toBe(fingerprint(again));
    expect(fingerprint(one)).not.toBe(fingerprint(moved));
    expect(fingerprint(one)).toMatch(/^[0-9a-f]{16} \(1 calls\)$/);
  });
});
