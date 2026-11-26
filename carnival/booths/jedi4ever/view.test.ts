import { describe, expect, it } from 'vitest';
import { bend, FAR, HORIZON, project, VAN_DEPTH } from './view';

describe('project', () => {
  it('shrinks with distance and heads for the horizon', () => {
    const near = project(100, 3, 0, 0);
    const far = project(100, FAR, 0, 0);
    expect(far.scale).toBeLessThan(near.scale);
    expect(far.y).toBeLessThan(near.y);
    expect(far.y).toBeGreaterThan(HORIZON * 100);
  });

  it('puts the left kerb left of the right kerb, centred under the van', () => {
    expect(project(100, 20, -1, 0).x).toBeLessThan(project(100, 20, 1, 0).x);
    expect(project(100, VAN_DEPTH, 0, 500).x).toBeCloseTo(50);
  });

  it('bends the far road with the distance run', () => {
    const a = project(100, 100, 0, 0).x;
    const b = project(100, 100, 0, 300).x;
    expect(a).not.toBeCloseTo(b);
    expect(bend(0)).toBe(0);
  });
});
