// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { drawingOf } from '../test-support/recording-canvas';
import { drawScene } from './visit-scenes';

const stage = { x: 100, y: 0, w: 800, h: 800 };

/** The calls a scene makes round a drawing on a 1000 by 800 screen. */
function sceneCalls(
  scene: Parameters<typeof drawScene>[0],
  scratch = document.createElement('canvas'),
) {
  return drawingOf((ctx) => {
    drawScene(scene, { ctx, width: 1000, height: 800, stage, scratch, size: 800 });
  });
}

const names = (calls: unknown[][]) => calls.map(([name]) => name);

describe('the mood round a drawing inside', () => {
  it('glows with its own colours by default, slipped in behind the drawing, never over it', () => {
    const calls = sceneCalls(undefined);
    expect(calls).toContainEqual(['=globalCompositeOperation', 'destination-over']);
    expect(names(calls)).toContain('drawImage');
    expect(names(calls)).not.toContain('createRadialGradient');
    expect(sceneCalls('glow')).toEqual(calls);
  });

  it('still lays the night behind a drawing that left nothing to copy', () => {
    const broken = {} as HTMLCanvasElement;
    const calls = sceneCalls(undefined, broken);
    expect(names(calls).filter((name) => name === 'fillRect')).toHaveLength(2);
  });

  it('falls into shadow for chiaroscuro: shade over the drawing, then a warm pool behind it', () => {
    const calls = names(sceneCalls('chiaroscuro'));
    const over = calls.indexOf('fillRect');
    const behind = calls.indexOf('=globalCompositeOperation');
    expect(over).toBeGreaterThan(-1);
    expect(over).toBeLessThan(behind);
    expect(calls.filter((name) => name === 'createRadialGradient')).toHaveLength(2);
    expect(calls).not.toContain('drawImage');
  });
});
