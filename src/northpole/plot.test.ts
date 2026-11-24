import { describe, expect, it, vi } from 'vitest';
import {
  applyKillSwitch,
  createAttractionRegistry,
  createPlotRegistry,
  fromFolders,
  isAttractionId,
  isPlotOwner,
  type NorthPolePlot,
} from './plot';

const plot = (owner: string): NorthPolePlot => ({
  owner,
  name: owner,
  description: 'A plot.',
  draw: () => {},
});

describe('isPlotOwner', () => {
  it('accepts GitHub logins in lower case', () => {
    expect(isPlotOwner('jedi4ever')).toBe(true);
    expect(isPlotOwner('mrs-claus')).toBe(true);
  });

  it('rejects anything a GitHub login cannot be', () => {
    expect(isPlotOwner('Jedi4ever')).toBe(false);
    expect(isPlotOwner('-elf')).toBe(false);
    expect(isPlotOwner('elf-')).toBe(false);
    expect(isPlotOwner('el--f')).toBe(false);
    expect(isPlotOwner('el_f')).toBe(false);
    expect(isPlotOwner('a'.repeat(40))).toBe(false);
  });
});

describe('createPlotRegistry', () => {
  it('finds a plot by owner, whatever the case', () => {
    const registry = createPlotRegistry([plot('rudolph')]);
    expect(registry.get('Rudolph')?.owner).toBe('rudolph');
    expect(registry.get('blitzen')).toBeUndefined();
  });

  it('refuses two plots for one owner', () => {
    expect(() => createPlotRegistry([plot('rudolph'), plot('rudolph')])).toThrow(/Two plots/);
  });

  it('refuses an owner that is not a login', () => {
    expect(() => createPlotRegistry([plot('Not A Login')])).toThrow(/GitHub login/);
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
    const registry = createAttractionRegistry([plot('big-top')]);
    expect(registry.get('Big-Top')?.owner).toBe('big-top');
    expect(registry.get('ferris-wheel')).toBeUndefined();
  });

  it('refuses two attractions with one id', () => {
    expect(() => createAttractionRegistry([plot('big-top'), plot('big-top')])).toThrow(
      /Two attractions/,
    );
  });

  it('refuses an id that is not kebab-case', () => {
    expect(() => createAttractionRegistry([plot('Big Top')])).toThrow(/kebab-case/);
  });
});

describe('fromFolders', () => {
  it('sorts the squares by folder', () => {
    const found = fromFolders({
      './vixen/plot.ts': plot('vixen'),
      './comet/plot.ts': plot('comet'),
    });
    expect(found.map((p) => p.owner)).toEqual(['comet', 'vixen']);
  });

  it('refuses a folder without a default export', () => {
    expect(() => fromFolders({ './comet/plot.ts': undefined })).toThrow(/default export/);
  });

  it('refuses a square whose owner is not its folder', () => {
    expect(() => fromFolders({ './comet/plot.ts': plot('vixen') })).toThrow(/folder is "comet"/);
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

  it('closes the listed plots, whatever the case, and leaves the rest alone', () => {
    const open = plot('rudolph');
    const plots = applyKillSwitch([open, plot('grinch')], ['Grinch']);
    expect(plots[0]).toBe(open);
    expect(plots[1].owner).toBe('grinch');
    expect(plots[1].description).toBe('Closed for repairs.');
  });

  it("never runs a closed plot's own draw", () => {
    const draw = vi.fn();
    const [closed] = applyKillSwitch([{ ...plot('grinch'), draw }], ['grinch']);
    const { ctx, text } = fakeContext();
    closed.draw(ctx, 100, 0);
    expect(draw).not.toHaveBeenCalled();
    expect(text).toEqual(['Closed for repairs']);
  });
});
