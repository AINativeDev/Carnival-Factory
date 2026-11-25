// @vitest-environment happy-dom
/**
 * Pins what the map draws and says while a visitor walks a level, frame by
 * frame, so splitting map.ts is proven to change nothing (docs/adr/0019-small-files.md).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { fingerprint, type CanvasCall } from '../test-support/recording-canvas';
import { startHarness, type MapHarness, type Screen } from '../test-support/map-harness';
import { click, key, point, screenAt } from '../test-support/map-events';
import { levelOptions, type Told } from '../test-support/map-fixtures';
import type { MapOptions } from './map-options';

let map: MapHarness | undefined;
afterEach(() => map?.stop());

/** Runs a visitor's journey and gives back one fingerprint of every frame and page state on it. */
function journey(
  options: (told: Told) => MapOptions,
  steps: (map: MapHarness, frame: (time: number) => void) => void,
  screen?: Screen,
) {
  const told: Told = [];
  map = startHarness(options(told), screen);
  const all: CanvasCall[] = [...map.started];
  const running = map;
  const frame = (time: number) => {
    all.push(...running.step(time), ['page', running.page()]);
  };
  steps(running, frame);
  all.push(['told', JSON.stringify(told)]);
  return fingerprint(all);
}

describe('walking a level', () => {
  it('stands, walks with the keys, and hovers a square', () => {
    const pin = journey(levelOptions, (map, frame) => {
      frame(0);
      frame(16);
      key('keydown', 'd');
      for (let t = 32; t < 600; t += 50) frame(t);
      key('keyup', 'd');
      key('keydown', 'ArrowUp');
      frame(650);
      frame(700);
      window.dispatchEvent(new Event('blur'));
      frame(3500);
      point(map, 'pointermove', screenAt(map, { x: -3, y: -3 }));
      frame(3600);
      point(map, 'pointerdown', screenAt(map, { x: -3, y: -3 }), { buttons: 1 });
      frame(3620);
      point(map, 'pointerleave', screenAt(map, { x: -3, y: -3 }));
      frame(3700);
    });
    expect(pin).toMatchInlineSnapshot(`"77c23603c7f4c7e4 (60971 calls)"`);
  });

  it('clicks the ground to walk, and a square to open it', () => {
    const pin = journey(levelOptions, (map, frame) => {
      frame(0);
      click(map, screenAt(map, { x: 0, y: -1 }));
      for (let t = 16; t < 2000; t += 100) frame(t);
      click(map, screenAt(map, { x: 2.5, y: 3.5 }));
      click(map, screenAt(map, { x: -3.5, y: -3.5 }));
      frame(2100);
      key('keydown', 'e');
      key('keydown', 'Enter');
      map.prompt.click();
      frame(2200);
    });
    expect(pin).toMatchInlineSnapshot(`"714c20eea5150c05 (69661 calls)"`);
  });

  it('walks to a square on a trail, then goes inside and out', () => {
    const pin = journey(levelOptions, (map, frame) => {
      frame(0);
      map.controls.walkTo('attraction', 'cocoa');
      for (let t = 16; t < 3000; t += 120) frame(t);
      map.setClock(3000);
      map.controls.visit('attraction', 'cocoa');
      for (let t = 3000; t < 3800; t += 100) frame(t);
      point(map, 'pointermove', { x: 600, y: 300 });
      frame(3900);
      click(map, { x: 600, y: 700 });
      for (let t = 4000; t < 6000; t += 200) frame(t);
      map.controls.leave();
      for (let t = 6000; t < 7000; t += 200) frame(t);
    });
    expect(pin).toMatchInlineSnapshot(`"c2a8fae3b7816ac7 (121348 calls)"`);
  });

  it('keeps still for reduced motion, on a phone with a touch screen', () => {
    const pin = journey(
      levelOptions,
      (map, frame) => {
        frame(0);
        frame(500);
        map.controls.walkTo('attraction', 'skates');
        frame(1000);
        map.controls.visit('attraction', 'skates');
        frame(1100);
      },
      { width: 390, height: 700, coarse: true, reduced: true },
    );
    expect(pin).toMatchInlineSnapshot(`"07eebccb5ad0dba3 (10329 calls)"`);
  });

  it('drags and pinches the camera with fingers on a phone', () => {
    const touch = { pointerType: 'touch' };
    const pin = journey(
      levelOptions,
      (map, frame) => {
        frame(0);
        frame(400);
        point(map, 'pointerdown', { x: 100, y: 300 }, { ...touch, pointerId: 7 });
        point(map, 'pointermove', { x: 160, y: 340 }, { ...touch, pointerId: 7 });
        frame(500);
        point(map, 'pointerdown', { x: 300, y: 300 }, { ...touch, pointerId: 8 });
        point(map, 'pointermove', { x: 340, y: 300 }, { ...touch, pointerId: 8 });
        frame(600);
        point(map, 'pointerup', { x: 340, y: 300 }, { ...touch, pointerId: 8 });
        point(map, 'pointercancel', { x: 160, y: 340 }, { ...touch, pointerId: 7 });
        frame(700);
        map.controls.toggleOverview();
        frame(800);
        map.controls.jumpTo('attraction', 'skates');
        frame(900);
        click(map, screenAt(map, { x: -3.5, y: -3.5 }), touch);
        frame(1000);
        click(map, screenAt(map, { x: -3.5, y: -3.5 }), touch);
        frame(1100);
      },
      { width: 390, height: 700, coarse: true },
    );
    expect(pin).toMatchInlineSnapshot(`"d0018dcfe382dba3 (25478 calls)"`);
  });
});
