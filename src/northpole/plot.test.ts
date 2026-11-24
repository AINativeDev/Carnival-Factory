import { describe, expect, it, vi } from 'vitest';
import { applyKillSwitch, createPlotRegistry, isPlotOwner, type NorthPolePlot } from './plot';

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
