// @vitest-environment happy-dom
/**
 * Pins what the map draws and says round the North Pole: booths, construction
 * sites, the sleigh station and open spots, frame by frame, so splitting
 * map.ts is proven to change nothing (docs/adr/0019-small-files.md).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fingerprint, type CanvasCall } from '../test-support/recording-canvas';
import { startHarness, type MapHarness } from '../test-support/map-harness';
import { click, key, point, screenAt } from '../test-support/map-events';
import { northPoleOptions, type Told } from '../test-support/map-fixtures';
import type { MapOptions } from './map-options';

let map: MapHarness | undefined;
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));
afterEach(() => {
  map?.stop();
  vi.restoreAllMocks();
});

/** Runs a visitor's journey and gives back one fingerprint of every frame and page state on it. */
function journey(
  extra: Partial<MapOptions>,
  steps: (map: MapHarness, frame: (time: number) => void) => void,
) {
  const told: Told = [];
  map = startHarness(northPoleOptions(told, extra));
  const all: CanvasCall[] = [...map.started];
  const running = map;
  steps(running, (time) => all.push(...running.step(time), ['page', running.page()]));
  all.push(['told', JSON.stringify(told)]);
  return fingerprint(all);
}

const site = { login: 'blitzen', issue: 12, spot: 9, stage: 'checks' as const };

describe('the North Pole', () => {
  it('shows booths, the visitor’s own, a landed booth and the sleigh station', () => {
    const pin = journey(
      { me: 'comet', wereSites: ['dancer'], focus: { kind: 'booth', id: 'jedi4ever' } },
      (map, frame) => {
        frame(0);
        frame(400);
        frame(1500);
        map.controls.setMe('dancer');
        map.controls.clearSelection();
        key('keydown', 'Escape');
        frame(1600);
        map.controls.jumpTo('booth', 'comet');
        for (let t = 1700; t < 2600; t += 150) frame(t);
        key('keydown', 'e');
        map.controls.walkToOpenSpot();
        for (let t = 2600; t < 6000; t += 200) frame(t);
        key('keydown', 'e');
        map.controls.claimNextDoor();
        for (let t = 6000; t < 9000; t += 200) frame(t);
      },
    );
    expect(pin).toMatchInlineSnapshot(`"1d95918dcbf246ea (574344 calls)"`);
  });

  it('builds construction sites, and updates a booth being changed', () => {
    const pin = journey(
      { pending: [site, { login: 'comet', issue: 3, spot: 1, stage: 'almost' }] },
      (map, frame) => {
        frame(0);
        map.controls.walkTo('booth', 'dancer');
        frame(100);
        map.record(() => {
          map.controls.setPending([]);
        });
        frame(200);
        map.record(() => {
          map.controls.setPending([site, { ...site, login: 'cupid', spot: 10 }]);
        });
        frame(300);
        map.controls.visit('booth', 'comet');
        map.record(() => {
          map.controls.setPending([site]);
        });
        frame(400);
        map.controls.leave();
        frame(600);
        // The whole island, so every construction site is in view however close the camera rests.
        map.controls.toggleOverview();
        for (let t = 650; t <= 2650; t += 500) frame(t);
        for (const kind of ['site', 'open', 'platform', 'exit'])
          point(map, 'pointermove', screenAt(map, { x: kind.length, y: 4 }));
        frame(700);
      },
    );
    expect(pin).toMatchInlineSnapshot(`"ad43f61c58ad39b9 (233011 calls)"`);
  });

  it('takes the sleigh from the station, but not to a level closed for repairs', () => {
    const pin = journey({}, (map, frame) => {
      frame(0);
      const spots = map.controls.nearest(40);
      for (let n = 0; n < 12; n++) {
        click(map, screenAt(map, { x: n - 6, y: 6 }));
        frame(100 + n * 100);
      }
      key('keydown', 'Enter');
      frame(1500);
      expect(spots.length).toBeGreaterThan(0);
    });
    expect(pin).toMatchInlineSnapshot(`"39cf654b306fd165 (227774 calls)"`);
  });

  it('draws avatars once they have loaded', () => {
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(64);
    const pin = journey({ avatars: new Set(['comet', 'jedi4ever']) }, (map, frame) => {
      frame(0);
      frame(100);
      map.controls.visit('booth', 'comet');
      frame(200);
      frame(900);
    });
    expect(pin).toMatchInlineSnapshot(`"84a2c9cb51110bec (85348 calls)"`);
  });
});
