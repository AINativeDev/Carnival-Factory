import { describe, expect, it } from 'vitest';
import { chosenStall, defaultStall, idHash } from './stall-default';
import { STALL_SHAPES, type NorthPoleSquare } from './square';
import { wallStyle } from './room-walls';

const square = (id: string, stall?: NorthPoleSquare['stall']): NorthPoleSquare => ({
  id,
  name: id,
  description: '',
  draw: () => undefined,
  ...(stall ? { stall } : {}),
});

describe('the stall a square stands in when it chooses none', () => {
  it('is picked from its id, the same every time', () => {
    expect(idHash('jedi4ever')).toBe(idHash('jedi4ever'));
    expect(idHash('jedi4ever')).not.toBe(idHash('jedi4evr'));
    expect(defaultStall('sjmaple')).toEqual(defaultStall('sjmaple'));
    expect(defaultStall('sjmaple').trim).toBeDefined();
  });

  it('spreads the lanes over every shape the map draws, not one market stall', () => {
    const ids = Array.from({ length: 400 }, (_, n) => `elf-${String(n)}`);
    const shapes = new Set(ids.map((id) => defaultStall(id).shape));
    expect([...shapes].sort()).toEqual([...STALL_SHAPES].sort());
    const roofs = new Set(ids.map((id) => defaultStall(id).roof));
    expect(roofs.size).toBeGreaterThan(4);
  });

  it('keeps exactly the stall a square chose', () => {
    const chosen = { shape: 'cabin', roof: 'berry', trim: 'gold' } as const;
    expect(chosenStall(square('jedi4ever', chosen))).toBe(chosen);
    expect(chosenStall(square('hamzaoza'))).toEqual(defaultStall('hamzaoza'));
  });

  it('dresses the room inside after the stall it stands in, picked or chosen', () => {
    expect(wallStyle(chosenStall(square('x', { shape: 'igloo', roof: 'ice' }))).material).toBe(
      'blocks',
    );
    expect(wallStyle(chosenStall(square('hamzaoza'))).material).toBeDefined();
  });
});
