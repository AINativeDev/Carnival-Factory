import { describe, expect, it } from 'vitest';
import { theme } from '../../../src/northpole/theme';
import { drawCube } from './cube';

/** A context that counts the blocks filled, so the test sees what is drawn. */
class FillCounter {
  fills = 0;
  blockFills = 0;
  inkStrokes = 0;
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 0;
  lineJoin = '';
  beginPath = () => undefined;
  moveTo = () => undefined;
  lineTo = () => undefined;
  fill = () => {
    this.fills++;
    if (this.fillStyle !== theme.colors.ink) this.blockFills++;
  };
  closePath = () => undefined;
  stroke = () => {
    if (this.strokeStyle === theme.colors.ink && this.lineWidth > 0) this.inkStrokes++;
  };
}

describe('the interlocking cube', () => {
  it('draws the top and the sides facing the viewer at every turn', () => {
    for (let step = 0; step < 16; step++) {
      const ctx = new FillCounter();
      drawCube(ctx as unknown as CanvasRenderingContext2D, 50, 50, 10, (step * Math.PI) / 8);
      // Top: ink plus 3 blocks; each visible side: ink plus 2 blocks.
      expect(ctx.fills).toBeGreaterThanOrEqual(8);
      // Every block is outlined in ink, so blocks that touch, as at a side's notch, stay apart.
      expect(ctx.inkStrokes).toBe(ctx.blockFills);
    }
  });
});
