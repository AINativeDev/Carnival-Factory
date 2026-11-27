import { describe, expect, it } from 'vitest';
import { drawingOf } from '../test-support/recording-canvas';
import {
  applyKillSwitch,
  closeForRepairs,
  createAttractionRegistry,
  createBoothRegistry,
  fromFolders,
  isAttractionId,
  isBoothOwner,
  type NorthPoleSquare,
} from './square';
import { canvasFont, theme } from './theme';

const square = (id: string): NorthPoleSquare => ({
  id,
  name: `The ${id}`,
  description: 'A square.',
  draw: () => undefined,
});

describe('what the registries say when they refuse a square', () => {
  it('names the booth owner or attraction id at fault, and why', () => {
    expect(() => createBoothRegistry([square('Not A Login')])).toThrow(
      new Error('Booth owner "Not A Login" must be a GitHub login in lower case'),
    );
    expect(() => createBoothRegistry([square('elf'), square('elf')])).toThrow(
      new Error('Two booths belong to "elf"'),
    );
    expect(() => createAttractionRegistry([square('Big Top')])).toThrow(
      new Error('Attraction id "Big Top" must be kebab-case'),
    );
    expect(() => createAttractionRegistry([square('big-top'), square('big-top')])).toThrow(
      new Error('Two attractions are called "big-top"'),
    );
  });

  it('names the folder whose square is missing or misnamed', () => {
    expect(() => fromFolders({ './comet/booth.ts': undefined })).toThrow(
      new Error('./comet/booth.ts needs a default export of its NorthPoleSquare'),
    );
    expect(() => fromFolders({ './comet/booth.ts': square('vixen') })).toThrow(
      new Error('./comet/booth.ts exports "vixen", but its folder is "comet"'),
    );
  });

  it('lists every square it holds, in order', () => {
    const squares = [square('elf'), square('comet')];
    expect(createBoothRegistry(squares).all()).toEqual(squares);
    expect(createAttractionRegistry([]).all()).toEqual([]);
  });
});

describe('the shapes of a login and an attraction id', () => {
  it('takes a login of one to 39 letters, digits and single hyphens between them', () => {
    for (const login of ['a', '7', 'a-b', 'a1-b2-c3', 'a'.repeat(39), `a-${'b'.repeat(37)}`])
      expect(isBoothOwner(login), login).toBe(true);
    for (const login of ['', ' a', 'a ', 'a-', 'a.b', `a-${'b'.repeat(38)}`])
      expect(isBoothOwner(login), login).toBe(false);
  });

  it('takes lower-case words joined by single hyphens as an id, and nothing round them', () => {
    for (const id of ['a', '7', 'a-b-c', 'big-top2']) expect(isAttractionId(id), id).toBe(true);
    for (const id of [' a', 'a ', 'a-', 'a.b', 'a b']) expect(isAttractionId(id), id).toBe(false);
  });
});

describe('a square closed for repairs', () => {
  it('keeps its id and name, and says it is closed in the middle of a plain square', () => {
    const closed = closeForRepairs({ id: 'elf', name: 'The elf' });
    expect([closed.id, closed.name, closed.description]).toEqual([
      'elf',
      'The elf',
      'Closed for repairs.',
    ]);
    expect(
      drawingOf((ctx) => {
        closed.draw(ctx, 200, 0);
      }),
    ).toEqual([
      ['=fillStyle', theme.colors.surface],
      ['fillRect', 0, 0, 200, 200],
      ['=fillStyle', theme.colors.muted],
      ['=font', canvasFont('small')],
      ['=textAlign', 'center'],
      ['fillText', 'Closed for repairs', 100, 100, 200],
    ]);
  });

  it('closes only the squares listed, whatever the case of the list', () => {
    const squares = applyKillSwitch([square('elf'), square('grinch')], ['GRINCH']);
    expect(squares.map(({ name, description }) => [name, description])).toEqual([
      ['The elf', 'A square.'],
      ['The grinch', 'Closed for repairs.'],
    ]);
  });
});
