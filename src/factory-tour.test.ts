import { describe, expect, it } from 'vitest';
import theFactory from '../carnival/levels/the-factory/level';
import { FACTORY_TOUR } from './factory-tour';

/**
 * How many path tiles each tile on The Factory's path is from the arrival
 * point, so a stall's place on the walk comes from where its door sits on
 * the path, not from the order the squares are listed in.
 */
function stepsAlongPath(): Map<string, number> {
  const path = new Set<string>();
  for (const { tile, area } of theFactory.ground ?? []) {
    if (tile !== 'path') continue;
    for (let dx = 0; dx < (area.w ?? 1); dx++)
      for (let dy = 0; dy < (area.h ?? 1); dy++) path.add(`${area.x + dx},${area.y + dy}`);
  }
  const start = theFactory.arrival;
  const steps = new Map([[`${start.x},${start.y}`, 0]]);
  const queue = [start];
  for (const { x, y } of queue) {
    for (const next of [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ]) {
      const key = `${next.x},${next.y}`;
      if (!path.has(key) || steps.has(key)) continue;
      steps.set(key, (steps.get(`${x},${y}`) ?? 0) + 1);
      queue.push(next);
    }
  }
  return steps;
}

describe('FACTORY_TOUR', () => {
  it('tells a step for every stall of The Factory, in the order the path passes them', () => {
    const steps = stepsAlongPath();
    const stalls = (theFactory.squares ?? []).map((square) => ({
      id: square.id,
      steps: steps.get(`${square.x + 2},${square.y}`),
    }));
    // Every stall's door opens onto the path, so the walk passes each one.
    expect(stalls.filter((stall) => stall.steps === undefined)).toEqual([]);
    const walked = [...stalls].sort((a, b) => (a.steps ?? 0) - (b.steps ?? 0));
    expect(Object.keys(FACTORY_TOUR)).toEqual(walked.map((stall) => stall.id));
  });

  it('keeps each step to a few plain sentences, with a link', () => {
    for (const stop of Object.values(FACTORY_TOUR)) {
      expect(stop.story.split('. ').length).toBeLessThanOrEqual(3);
      expect(stop.href).toMatch(/^https:\/\/github\.com\//);
      expect(stop.label).not.toBe('');
    }
  });
});
