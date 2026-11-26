// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startHarness, type MapHarness } from '../test-support/map-harness';
import { levelOptions, northPoleOptions, type Told } from '../test-support/map-fixtures';
import type { MapOptions } from './map-options';

let map: MapHarness | undefined;
let told: Told = [];
afterEach(() => {
  map?.stop();
  map = undefined;
  vi.restoreAllMocks();
});

const start = (options: (told: Told) => MapOptions, extra: Partial<MapOptions> = {}) => {
  told = [];
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  map = startHarness({ ...options(told), ...extra });
  return map;
};

const site = { login: 'blitzen', issue: 12, spot: 9, stage: 'building' as const };

describe('the controls the page has over a map', () => {
  it('ignores squares that are not on the map', () => {
    const { controls } = start(levelOptions);
    controls.walkTo('booth', 'nobody');
    controls.jumpTo('booth', 'nobody');
    expect(controls.visit('booth', 'nobody')).toBe(false);
    expect(controls.selected).toBeUndefined();
    expect(told).toEqual([]);
  });

  it('leaves the square the player is inside before walking or jumping to another', () => {
    const { controls, step } = start(levelOptions);
    step(0);
    expect(controls.visit('attraction', 'skates')).toBe(true);
    expect(controls.visit('attraction', 'skates')).toBe(true);
    expect(controls.visiting).toEqual({ kind: 'attraction', id: 'skates' });
    controls.walkTo('attraction', 'cocoa');
    controls.jumpTo('attraction', 'cocoa');
    controls.walkToOpenSpot();
    expect(told.filter(([what]) => what === 'leave')).toHaveLength(3);
    expect(controls.selected).toEqual({ kind: 'attraction', id: 'cocoa' });
  });

  it('goes from inside one square straight inside another', () => {
    const { controls, step } = start(levelOptions);
    step(0);
    controls.visit('attraction', 'skates');
    expect(controls.visit('attraction', 'cocoa')).toBe(true);
    expect(controls.visiting).toEqual({ kind: 'attraction', id: 'cocoa' });
  });

  it('goes inside from its own door, and back out facing out', () => {
    const { controls, step, frame, canvas } = start(levelOptions);
    controls.jumpTo('attraction', 'skates');
    step(0);
    controls.visit('attraction', 'skates');
    expect(frame.dataset.visiting).toBe('attraction:skates');
    controls.leave();
    controls.leave();
    expect(controls.visiting).toBeUndefined();
    expect(frame.dataset.visiting).toBeUndefined();
    step(16);
    expect(canvas.dataset.player).toBeDefined();
  });

  it('shows the whole island, and a jump or a visit goes back to the carnival', () => {
    const { controls } = start(levelOptions);
    expect(controls.toggleOverview()).toBe(true);
    expect(controls.overview).toBe(true);
    controls.jumpTo('attraction', 'skates');
    expect(controls.overview).toBe(false);
    controls.toggleOverview();
    controls.visit('attraction', 'cocoa');
    expect(controls.overview).toBe(false);
  });

  it('names the squares nearest the player, and lets go of the picked one', () => {
    const { controls } = start(northPoleOptions, { focus: { kind: 'booth', id: 'comet' } });
    expect(controls.selected).toEqual({ kind: 'booth', id: 'comet' });
    expect(controls.nearest(2)[0]).toEqual({ kind: 'booth', id: 'comet' });
    controls.clearSelection();
    expect(controls.selected).toBeUndefined();
    expect(told).toContainEqual(['select', undefined, undefined]);
  });

  it('has no open spot to claim or walk to in a level', () => {
    const { controls, step, canvas } = start(levelOptions);
    step(0);
    const at = canvas.dataset.player;
    controls.claimNextDoor();
    controls.walkToOpenSpot();
    step(500);
    expect(canvas.dataset.player).toBe(at);
  });
});

describe('construction sites', () => {
  it('lays the world out again only when a spot moved', () => {
    const { controls, record, canvas } = start(northPoleOptions);
    expect(
      record(() => {
        controls.setPending([]);
      }),
    ).toEqual([]);
    expect(canvas.dataset.sites).toBeUndefined();
    expect(
      record(() => {
        controls.setPending([site]);
      }).length,
    ).toBeGreaterThan(0);
    expect(controls.sites).toEqual(['blitzen']);
    expect(canvas.dataset.sites).toBe('blitzen');
  });

  it('keeps hold of the picked square, the spot being claimed and the walk on the way', () => {
    const { controls, step, canvas } = start(northPoleOptions);
    step(0);
    controls.claimNextDoor();
    for (let t = 100; t < 1500; t += 100) step(t);
    controls.setPending([site]);
    controls.walkTo('booth', 'dancer');
    step(1600);
    controls.setPending([]);
    expect(controls.selected).toEqual({ kind: 'booth', id: 'dancer' });
    controls.visit('booth', 'dancer');
    for (let t = 1700; t < 2500; t += 100) step(t);
    controls.setPending([site]);
    for (let t = 1800; t < 2600; t += 100) step(t);
    expect(controls.visiting).toEqual({ kind: 'booth', id: 'dancer' });
    expect(canvas.dataset.stage).toBeDefined();
  });

  it('says who the visitor is', () => {
    const { controls, step } = start(northPoleOptions);
    controls.setMe('comet');
    controls.setMe(undefined);
    expect(step(0).length).toBeGreaterThan(0);
  });
});
