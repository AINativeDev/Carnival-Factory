// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { levelOptions, northPoleOptions } from '../test-support/map-fixtures';
import { lookOf, PLAYER } from './map-crowd';
import { avatarOf, ownerOf, platformLabel, siteLabel, squareOf } from './map-labels';
import { open } from './map-open';
import type { MapOptions } from './map-options';
import { promptWords } from './map-prompt';
import { openRun } from './map-run';
import type { Plot } from './world';

afterEach(() => {
  vi.restoreAllMocks();
});

/** A map's run, started but never drawn, so its labels can be asked directly. */
const runOf = (options: MapOptions) =>
  openRun(
    document.createElement('div'),
    document.createElement('canvas'),
    document.createElement('button'),
    options,
  );

const plot = (kind: Plot['kind'], id?: string): Plot => ({
  kind,
  ...(id !== undefined && { id }),
  number: 4,
  x: 0,
  y: 0,
  w: 2,
  h: 2,
  door: { x: 2, y: 0 },
});

describe('what plots say', () => {
  const pending = [{ login: 'blitzen', issue: 12, plot: 9, stage: 'almost' as const }];
  const m = runOf(northPoleOptions([], { pending, me: 'comet' }));

  it('finds the square on a booth or attraction plot, and none elsewhere', () => {
    expect(squareOf(m, plot('booth', 'comet'))?.name).toBe('The comet');
    expect(squareOf(m, plot('booth'))).toBeUndefined();
    expect(squareOf(m, plot('site', 'comet'))).toBeUndefined();
  });

  it('labels a platform by its level, or as closed when it has none, and the way home in gold', () => {
    expect(platformLabel(m, plot('platform', 'tester'))).toMatchObject({ name: 'Test Fair' });
    expect(platformLabel(m, plot('platform', 'gone'))).toEqual({
      name: 'gone',
      by: '@gone',
      color: expect.any(String) as string,
      closed: true,
    });
    expect(platformLabel(m, plot('platform')).name).toBe('');
    expect(platformLabel(m, plot('exit')).closed).toBe(false);
    expect(platformLabel(m, plot('platform', 'shut')).by).toBe('The North Pole');
  });

  it("says a site's stage, and that it's being built when the request is unknown", () => {
    expect(siteLabel(m, plot('site', 'blitzen')).stage).not.toBe(
      siteLabel(m, plot('site', 'cupid')).stage,
    );
    expect(siteLabel(m, plot('site')).login).toBe('');
  });

  it('puts the right words on the call to action', () => {
    expect(promptWords(m, plot('open'))).toBe('Claim this plot');
    expect(promptWords(m, plot('site', 'blitzen'))).toMatch(/^Being built for @blitzen: /);
    expect(promptWords(m, plot('exit'))).toBe('Take the sleigh back to the North Pole');
    expect(promptWords(m, plot('platform', 'tester'))).toBe('Take the sleigh to Test Fair');
    expect(promptWords(m, plot('platform', 'shut'))).toBe('Shut Fair is closed for repairs');
    expect(promptWords(m, plot('attraction', 'ferris-wheel'))).toBe('Visit The ferris-wheel');
    expect(promptWords(m, plot('attraction', 'unknown'))).toBe('Visit unknown');
    expect(promptWords(m, plot('attraction'))).toBe('Visit ');
  });

  it("gives a booth its owner's colour, and the visitor's own a glow", () => {
    expect(ownerOf(m, plot('attraction', 'ferris-wheel'))).toBeUndefined();
    expect(ownerOf(m, plot('booth', 'comet'))).toMatchObject({ you: true });
    expect(ownerOf(m, plot('booth'))).toMatchObject({ you: false });
  });

  it('tints the way home inside a level with its theme', () => {
    expect(platformLabel(runOf(levelOptions([])), plot('exit')).color).toBe('tint');
  });
});

describe('the crowd', () => {
  it("wears the player's look when a number has no look of its own", () => {
    expect(lookOf(-1)).toBe(PLAYER);
    expect(lookOf(5)).not.toBe(PLAYER);
  });
});

describe('avatars', () => {
  it('draws the elf until an avatar loads, and for good once it fails', () => {
    const m = runOf(northPoleOptions([], { avatars: new Set(['comet']) }));
    expect(avatarOf(m, 'dancer')).toBeUndefined();
    expect(avatarOf(m, 'comet')).toBeUndefined();
    m.avatars.get('comet')?.dispatchEvent(new Event('error'));
    expect(m.avatars.get('comet')).toBeUndefined();
  });
});

describe('opening a plot', () => {
  it('opens the claim form for an open plot, and the request for a site', () => {
    const opened: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      opened.push(this.href);
    });
    const pending = [{ login: 'blitzen', issue: 12, plot: 9, stage: 'almost' as const }];
    const m = runOf(northPoleOptions([], { pending }));
    open(m, plot('open'));
    open(m, plot('site', 'blitzen'));
    open(m, plot('site', 'cupid'));
    open(m, plot('booth'));
    expect(opened).toHaveLength(3);
    expect(opened[1]).toMatch(/\/issues\/12$/);
  });

  it('takes the sleigh to an open level, not a closed one', () => {
    const told: (string | undefined)[][] = [];
    const m = runOf(northPoleOptions(told));
    open(m, plot('platform', 'tester'));
    open(m, plot('platform', 'shut'));
    open(m, plot('exit'));
    expect(told).toEqual([
      ['travel', 'tester'],
      ['travel', undefined],
    ]);
  });

  it('takes no sleigh when the page has nowhere to go', () => {
    const told: string[][] = [];
    const options = levelOptions([], { onOpen: () => told.push([]) });
    delete options.onTravel;
    const m = runOf(options);
    open(m, plot('exit'));
    open(m, plot('platform', 'tester'));
    m.stations.set('tester', { login: 'tester', name: 'Open', color: 'sign', closed: false });
    open(m, plot('platform', 'tester'));
    expect(told).toEqual([]);
  });
});
