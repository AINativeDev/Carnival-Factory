// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { levelOptions, northPoleOptions } from '../test-support/map-fixtures';
import { lookOf, PLAYER } from './map-crowd';
import { avatarOf, ownerOf, platformLabel, siteLabel, squareOf } from './map-labels';
import { open } from './map-open';
import type { MapOptions } from './map-options';
import { promptWords } from './map-prompt';
import { openRun } from './map-run';
import type { Spot } from './world';

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

const spot = (kind: Spot['kind'], id?: string): Spot => ({
  kind,
  ...(id !== undefined && { id }),
  number: 4,
  x: 0,
  y: 0,
  w: 2,
  h: 2,
  door: { x: 2, y: 0 },
});

describe('what spots say', () => {
  const pending = [{ login: 'blitzen', issue: 12, spot: 9, stage: 'almost' as const }];
  const m = runOf(northPoleOptions([], { pending, me: 'comet' }));

  it('finds the square on a booth or attraction spot, and none elsewhere', () => {
    expect(squareOf(m, spot('booth', 'comet'))?.name).toBe('The comet');
    expect(squareOf(m, spot('booth'))).toBeUndefined();
    expect(squareOf(m, spot('site', 'comet'))).toBeUndefined();
  });

  it('labels a platform by its level, or as closed when it has none, and the way home in gold', () => {
    expect(platformLabel(m, spot('platform', 'tester'))).toMatchObject({ name: 'Test Fair' });
    expect(platformLabel(m, spot('platform', 'gone'))).toEqual({
      name: 'gone',
      by: '@gone',
      color: expect.any(String) as string,
      closed: true,
    });
    expect(platformLabel(m, spot('platform')).name).toBe('');
    expect(platformLabel(m, spot('exit')).closed).toBe(false);
    expect(platformLabel(m, spot('platform', 'shut')).by).toBe('The North Pole');
  });

  it("says a site's stage, and that it's being built when the request is unknown", () => {
    expect(siteLabel(m, spot('site', 'blitzen')).stage).not.toBe(
      siteLabel(m, spot('site', 'cupid')).stage,
    );
    expect(siteLabel(m, spot('site')).login).toBe('');
  });

  it('puts the right words on the call to action', () => {
    expect(promptWords(m, spot('open'))).toBe('Build your booth here');
    expect(promptWords(m, spot('site', 'blitzen'))).toMatch(/^Booth for @blitzen: /);
    expect(promptWords(m, spot('exit'))).toBe('Take the sleigh back to the North Pole');
    expect(promptWords(m, spot('platform', 'tester'))).toBe('Take the sleigh to Test Fair');
    expect(promptWords(m, spot('platform', 'shut'))).toBe('Shut Fair is closed for repairs');
    expect(promptWords(m, spot('attraction', 'ferris-wheel'))).toBe('Visit The ferris-wheel');
    expect(promptWords(m, spot('attraction', 'unknown'))).toBe('Visit unknown');
    expect(promptWords(m, spot('attraction'))).toBe('Visit ');
  });

  it("gives a booth its owner's colour, and the visitor's own a glow", () => {
    expect(ownerOf(m, spot('attraction', 'ferris-wheel'))).toBeUndefined();
    expect(ownerOf(m, spot('booth', 'comet'))).toMatchObject({ you: true });
    expect(ownerOf(m, spot('booth'))).toMatchObject({ you: false });
  });

  it('tints the way home inside a level with its theme', () => {
    expect(platformLabel(runOf(levelOptions([])), spot('exit')).color).toBe('tint');
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

describe('opening a spot', () => {
  it('opens the booth form at a free spot, and the request for a site', () => {
    const opened: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      opened.push(this.href);
    });
    const pending = [{ login: 'blitzen', issue: 12, spot: 9, stage: 'almost' as const }];
    const m = runOf(northPoleOptions([], { pending }));
    open(m, spot('open'));
    open(m, spot('site', 'blitzen'));
    open(m, spot('site', 'cupid'));
    open(m, spot('booth'));
    expect(opened).toHaveLength(3);
    expect(opened[1]).toMatch(/\/issues\/12$/);
  });

  it('takes the sleigh to an open level, not a closed one', () => {
    const told: (string | undefined)[][] = [];
    const m = runOf(northPoleOptions(told));
    open(m, spot('platform', 'tester'));
    open(m, spot('platform', 'shut'));
    open(m, spot('exit'));
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
    open(m, spot('exit'));
    open(m, spot('platform', 'tester'));
    // deepcode ignore NoHardcodedCredentials/test: a made-up participant's login, not a credential.
    m.stations.set('tester', { login: 'tester', name: 'Open', color: 'sign', closed: false });
    open(m, spot('platform', 'tester'));
    expect(told).toEqual([]);
  });
});
