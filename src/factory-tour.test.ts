import { describe, expect, it } from 'vitest';
import theFactory from '../carnival/levels/the-factory/level';
import { FACTORY_TOUR } from './factory-tour';

describe('FACTORY_TOUR', () => {
  it('tells a step for every stall of The Factory, in the order the path passes them', () => {
    expect(Object.keys(FACTORY_TOUR)).toEqual(
      (theFactory.squares ?? []).map((square) => square.id),
    );
  });

  it('keeps each step to a few plain sentences, with a link', () => {
    for (const stop of Object.values(FACTORY_TOUR)) {
      expect(stop.story.split('. ').length).toBeLessThanOrEqual(3);
      expect(stop.href).toMatch(/^https:\/\/github\.com\//);
      expect(stop.label).not.toBe('');
    }
  });
});
