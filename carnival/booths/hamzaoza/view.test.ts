import { describe, expect, it } from 'vitest';
import { inView, project, scaleAt, VIEW } from './view';

describe('the view', () => {
  it('shrinks things towards the horizon and puts the penguin at the front', () => {
    expect(scaleAt(0)).toBe(1);
    expect(scaleAt(50)).toBeLessThan(scaleAt(10));
    expect(project(0, 0, 0)).toEqual({ k: 1, x: 50, y: 92 });
    expect(project(0, 30, 0).y).toBeLessThan(project(0, 5, 0).y);
  });

  it('lists what is ahead, furthest first', () => {
    const seen = inView(1, 100);
    expect(seen.length).toBeGreaterThan(0);
    const aheads = seen.map((s) => s.ahead);
    expect(aheads).toEqual([...aheads].sort((a, b) => b - a));
    for (const { ahead } of seen) expect(ahead > 0 && ahead <= VIEW).toBe(true);
  });
});
