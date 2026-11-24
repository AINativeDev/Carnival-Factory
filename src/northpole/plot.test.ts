import { describe, expect, it } from 'vitest';
import { createPlotRegistry, isPlotOwner, type NorthPolePlot } from './plot';

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
