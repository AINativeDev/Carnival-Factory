import { describe, expect, it, vi } from 'vitest';
import {
  applyKillSwitch,
  createAttractionRegistry,
  createBoothRegistry,
  fromFolders,
  idsFromFolders,
  isAttractionId,
  isBoothOwner,
  type NorthPoleSquare,
} from './square';

const booth = (id: string): NorthPoleSquare => ({
  id,
  name: id,
  description: 'A booth.',
  draw: () => {},
});

describe('isBoothOwner', () => {
  it('accepts GitHub logins in lower case', () => {
    expect(isBoothOwner('jedi4ever')).toBe(true);
    expect(isBoothOwner('mrs-claus')).toBe(true);
  });

  it('rejects anything a GitHub login cannot be', () => {
    expect(isBoothOwner('Jedi4ever')).toBe(false);
    expect(isBoothOwner('-elf')).toBe(false);
    expect(isBoothOwner('elf-')).toBe(false);
    expect(isBoothOwner('el--f')).toBe(false);
    expect(isBoothOwner('el_f')).toBe(false);
    expect(isBoothOwner('a'.repeat(40))).toBe(false);
  });
});

describe('createBoothRegistry', () => {
  it('finds a booth by owner, whatever the case', () => {
    const registry = createBoothRegistry([booth('rudolph')]);
    expect(registry.get('Rudolph')?.id).toBe('rudolph');
    expect(registry.get('blitzen')).toBeUndefined();
  });

  it('refuses two booths for one owner', () => {
    expect(() => createBoothRegistry([booth('rudolph'), booth('rudolph')])).toThrow(/Two booths/);
  });

  it('refuses an owner that is not a login', () => {
    expect(() => createBoothRegistry([booth('Not A Login')])).toThrow(/GitHub login/);
  });
});

describe('isAttractionId', () => {
  it('accepts kebab-case ids', () => {
    expect(isAttractionId('ferris-wheel')).toBe(true);
    expect(isAttractionId('big-top')).toBe(true);
    expect(isAttractionId('carousel')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isAttractionId('Ferris-Wheel')).toBe(false);
    expect(isAttractionId('ferris_wheel')).toBe(false);
    expect(isAttractionId('ferris--wheel')).toBe(false);
    expect(isAttractionId('-wheel')).toBe(false);
    expect(isAttractionId('')).toBe(false);
  });
});

describe('createAttractionRegistry', () => {
  it('finds an attraction by id, whatever the case', () => {
    const registry = createAttractionRegistry([booth('big-top')]);
    expect(registry.get('Big-Top')?.id).toBe('big-top');
    expect(registry.get('ferris-wheel')).toBeUndefined();
  });

  it('refuses two attractions with one id', () => {
    expect(() => createAttractionRegistry([booth('big-top'), booth('big-top')])).toThrow(
      /Two attractions/,
    );
  });

  it('refuses an id that is not kebab-case', () => {
    expect(() => createAttractionRegistry([booth('Big Top')])).toThrow(/kebab-case/);
  });
});

describe('fromFolders', () => {
  it('sorts the squares by folder', () => {
    const found = fromFolders({
      './vixen/booth.ts': booth('vixen'),
      './comet/booth.ts': booth('comet'),
    });
    expect(found.map((p) => p.id)).toEqual(['comet', 'vixen']);
  });

  it('refuses a folder without a default export', () => {
    expect(() => fromFolders({ './comet/booth.ts': undefined })).toThrow(/default export/);
  });

  it('refuses a square whose owner is not its folder', () => {
    expect(() => fromFolders({ './comet/booth.ts': booth('vixen') })).toThrow(/folder is "comet"/);
  });
});

describe('applyKillSwitch', () => {
  // Enough of a canvas context for the closed sign, recording the text it writes.
  const fakeContext = () => {
    const text: string[] = [];
    const ctx = {
      fillRect: () => {},
      fillText: (value: string) => text.push(value),
    } as unknown as CanvasRenderingContext2D;
    return { ctx, text };
  };

  it('closes the listed booths, whatever the case, and leaves the rest alone', () => {
    const open = booth('rudolph');
    const booths = applyKillSwitch([open, booth('grinch')], ['Grinch']);
    expect(booths[0]).toBe(open);
    expect(booths[1].id).toBe('grinch');
    expect(booths[1].description).toBe('Closed for repairs.');
  });

  it("never runs a closed booth's own draw", () => {
    const draw = vi.fn();
    const [closed] = applyKillSwitch([{ ...booth('grinch'), draw }], ['grinch']);
    const { ctx, text } = fakeContext();
    closed.draw(ctx, 100, 0);
    expect(draw).not.toHaveBeenCalled();
    expect(text).toEqual(['Closed for repairs']);
  });
});

describe('the registries', () => {
  it("freeze every square, so nobody can swap another square's draw", () => {
    const registry = createBoothRegistry([booth('elf')]);
    const elf = registry.get('elf')!;
    expect(Object.isFrozen(elf)).toBe(true);
    expect(() => {
      (elf as { draw: NorthPoleSquare['draw'] }).draw = () => {};
    }).toThrow();
  });
});

describe('idsFromFolders', () => {
  it("gives each square's folder name, sorted", () => {
    expect(
      idsFromFolders([
        '../carnival/booths/zed/booth.ts',
        '../carnival/booths/elf/booth.ts',
        './a-b/attraction.ts',
      ]),
    ).toEqual(['a-b', 'elf', 'zed']);
  });
});
