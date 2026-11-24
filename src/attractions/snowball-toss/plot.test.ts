import { describe, expect, it } from 'vitest';
import { snowballAt, THROW, topple } from './plot';

describe('snowballAt', () => {
  it('leaves from the front of the booth', () => {
    expect(snowballAt(0)).toEqual({ x: 80, y: 90 });
  });

  it('arcs up above the line it flies along', () => {
    const middle = snowballAt(THROW * 0.2)!;
    expect(middle.y).toBeLessThan(33 + 28);
  });

  it('lands on the top snowman and is gone until the next throw', () => {
    const landing = snowballAt(THROW * 0.4 - 1)!;
    expect(landing.x).toBeCloseTo(50, 0);
    expect(landing.y).toBeCloseTo(33, 0);
    expect(snowballAt(THROW * 0.6)).toBeUndefined();
    expect(snowballAt(THROW)).toEqual(snowballAt(0));
  });
});

describe('topple', () => {
  it('keeps the snowman standing until the snowball lands', () => {
    expect(topple(0)).toBe(0);
    expect(topple(THROW * 0.39)).toBe(0);
  });

  it('knocks it flat, then stands it back up for the next throw', () => {
    expect(topple(THROW * 0.7)).toBe(1);
    expect(topple(THROW * 0.99)).toBeLessThan(0.1);
  });
});
