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

  it('darkens all round for chiaroscuro, with a warm pool of light, and never shades the drawing', () => {
    const calls = sceneCalls('chiaroscuro');
    const behind = names(calls).indexOf('=globalCompositeOperation');
    expect(names(calls).indexOf('fillRect')).toBeGreaterThan(behind);
    expect(names(calls).filter((name) => name === 'createRadialGradient')).toHaveLength(1);
    expect(names(calls)).not.toContain('drawImage');
  });
});
