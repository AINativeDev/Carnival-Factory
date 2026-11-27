// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { levelOptions, northPoleOptions } from '../test-support/map-fixtures';
import { rideOptions } from '../test-support/ride-fixtures';
import type { MapOptions } from './map-options';
import { openRun } from './map-run';
import { remembered } from './map-state';

afterEach(() => {
  remembered.clear();
  document.body.replaceChildren();
});

/** A run opened in a frame of its own, never drawn. */
const runOf = (options: MapOptions) => {
  const frame = document.createElement('div');
  return {
    frame,
    m: openRun(frame, document.createElement('canvas'), document.createElement('button'), options),
  };
};

describe('a map as it begins', () => {
  it('starts everything it keeps between frames at rest', () => {
    const { m } = runOf(northPoleOptions([], { me: 'comet' }));
    expect(m).toMatchObject({
      selected: undefined,
      selectedAt: undefined,
      trailing: false,
      me: 'comet',
      invited: undefined,
      invitedAt: 0,
      path: [],
      facing: 1,
      moving: false,
      camera: undefined,
      zoom: 0,
      walking: 0,
      movedAt: -Infinity,
      overview: false,
      panned: undefined,
      dragging: undefined,
      pinching: undefined,
      chosen: undefined,
      near: undefined,
      scale: 1,
      last: undefined,
      visiting: undefined,
      claiming: undefined,
      footprints: [],
      entered: undefined,
      fading: -Infinity,
      hovered: undefined,
      tagged: undefined,
      frameId: 0,
      frames: 0,
      slowest: 0,
      recent: [],
      targets: [],
      place: '',
      ride: undefined,
      rideButton: undefined,
    });
    expect([m.fingers.size, m.held.size, m.avatars.size]).toEqual([0, 0, 0]);
    expect([m.touchScreen.media, m.reduced.media]).toEqual([
      '(pointer: coarse)',
      '(prefers-reduced-motion: reduce)',
    ]);
    expect(Object.values(m.layers).map(({ canvas }) => [canvas.width, canvas.height])).toEqual([
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1],
    ]);
    expect(m.player).toEqual(m.world.start);
    expect(m.player).not.toBe(m.world.start);
  });

  it('knows its squares, its requests, its levels and the booths that just landed', () => {
    const pending = [{ login: 'zed', issue: 7, spot: 40, stage: 'building' as const }];
    const { m } = runOf(northPoleOptions([], { pending, wereSites: ['comet', 'nobody', 'comet'] }));
    expect([...m.squares.booth.keys()]).toEqual(['jedi4ever', 'comet', 'dancer']);
    expect([...m.squares.attraction.keys()]).toEqual(['ferris-wheel', 'broken']);
    expect(m.pending.get('zed')).toBe(pending[0]);
    expect([...m.stations.keys()]).toEqual(['tester', 'shut']);
    expect([...m.landed]).toEqual([['comet', undefined]]);
  });

  it('puts the player at the door of the square the page opened on', () => {
    const { m } = runOf(northPoleOptions([], { focus: { kind: 'booth', id: 'comet' } }));
    expect(m.selected?.id).toBe('comet');
    expect(m.player).toEqual(m.selected?.door);
    expect(m.player).not.toBe(m.selected?.door);
  });

  it('has no sleigh platforms in a level', () => {
    expect(runOf(levelOptions([])).m.stations.size).toBe(0);
  });

  it('puts the player back where they last stood in this world', () => {
    remembered.set('tester', { x: 3, y: 4 });
    const { m } = runOf(levelOptions([]));
    expect(m.place).toBe('tester');
    expect(m.player).toEqual({ x: 3, y: 4 });
  });

  it('seats the player in the car in a ride level, with a button to ride on', () => {
    const { m, frame } = runOf(rideOptions([]));
    expect(m.ride).toBeDefined();
    expect(m.rideButton?.parentElement).toBe(frame);
  });
});
