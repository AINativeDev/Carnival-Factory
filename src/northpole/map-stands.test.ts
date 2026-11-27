// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startHarness, type MapHarness } from '../test-support/map-harness';
import { northPoleOptions } from '../test-support/map-fixtures';
import { fingerprint, type CanvasCall } from '../test-support/recording-canvas';
import { layWorld } from './map-plan';
import { remembered } from './map-state';
import type { MapOptions } from './map-options';

let map: MapHarness | undefined;
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));
afterEach(() => {
  map?.stop();
  map = undefined;
  remembered.clear();
  vi.restoreAllMocks();
});

/** Every frame from `from` to `to`, `every` milliseconds apart, as one list of calls. */
const frames = (running: MapHarness, from: number, to: number, every: number) => {
  const calls: CanvasCall[] = [];
  for (let t = from; t <= to; t += every) calls.push(...running.step(t));
  return calls;
};

const start = (options: MapOptions, reduced = false) => {
  map = startHarness(options, { width: 900, height: 600, reduced });
  return map;
};

describe('a booth that replaced its construction site', () => {
  it('sparkles from the first frame it is in view until the sparkle is over, as pinned', () => {
    const options = northPoleOptions([], { wereSites: ['jedi4ever'] });
    const running = start({ ...options, focus: { kind: 'booth', id: 'jedi4ever' } });
    expect(fingerprint(frames(running, 10_000, 13_000, 500))).toMatchInlineSnapshot(
      `"4f6f7437aeb6f64d (97396 calls)"`,
    );
  });

  it('never sparkles for reduced motion', () => {
    const options = northPoleOptions([], { wereSites: ['jedi4ever'] });
    const running = start({ ...options, focus: { kind: 'booth', id: 'jedi4ever' } }, true);
    const sparkled = fingerprint(frames(running, 10_000, 11_000, 500));
    running.stop();
    const still = start(
      { ...northPoleOptions([]), focus: { kind: 'booth', id: 'jedi4ever' } },
      true,
    );
    expect(sparkled).toBe(fingerprint(frames(still, 10_000, 11_000, 500)));
  });
});

describe('the spot the player is at', () => {
  it('bounces a free spot being claimed, as pinned', () => {
    const running = start(northPoleOptions([]));
    running.controls.jumpTo('booth', 'dancer');
    running.step(0);
    running.controls.claimNextDoor();
    expect(fingerprint(frames(running, 100, 700, 200))).toMatchInlineSnapshot(
      `"e8a0681f36701ac9 (48137 calls)"`,
    );
  });

  it('lights the sleigh platform the player stands at, as pinned', () => {
    const options = northPoleOptions([]);
    const platform = layWorld(options, []).spots.find((spot) => spot.kind === 'platform');
    if (!platform) throw new Error('no platform');
    remembered.set('', { ...platform.door });
    const running = start(options, true);
    running.step(0);
    expect(running.canvas.dataset.near).toBe(`platform:${String(platform.id)}`);
    expect(fingerprint(frames(running, 100, 500, 200))).toMatchInlineSnapshot(
      `"13a9f6a200794f2e (38469 calls)"`,
    );
  });
});
