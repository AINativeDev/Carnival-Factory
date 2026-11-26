import { describe, expect, it } from 'vitest';
import { isOffMap, offMapSpot } from './off-map';
import type { Thing, World } from './world';

const billboard: Thing = { kind: 'billboard', x: 15, y: -4, w: 2, h: 1, seed: 0, blocks: true };
const world = (things: Thing[]) => ({ things }) as unknown as World;

describe('an attraction with no stall of its own', () => {
  it('is AI DevCon, and nothing else, not even a name like constructor', () => {
    expect(isOffMap('ai-devcon')).toBe(true);
    expect(isOffMap('ferris-wheel')).toBe(false);
    expect(isOffMap('constructor')).toBe(false);
  });

  it('is visited at its way in, the billboard, with the door just in front of it', () => {
    expect(offMapSpot(world([billboard]), 'attraction', 'ai-devcon')).toEqual({
      kind: 'attraction',
      id: 'ai-devcon',
      number: -1,
      x: 15,
      y: -4,
      w: 2,
      h: 1,
      door: { x: 16, y: -2.5 },
    });
  });

  it('has no spot without its way in on the map, for another kind or another attraction', () => {
    expect(offMapSpot(world([]), 'attraction', 'ai-devcon')).toBeUndefined();
    expect(offMapSpot(world([billboard]), 'booth', 'ai-devcon')).toBeUndefined();
    expect(offMapSpot(world([billboard]), 'attraction', 'ferris-wheel')).toBeUndefined();
  });
});
