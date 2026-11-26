// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { averageColour, tintFrame } from './visit-tint';

describe('the tint of the square someone is inside', () => {
  it('averages the pixels a drawing shows, skipping clear ones', () => {
    expect(averageColour([10, 20, 30, 255, 30, 40, 50, 255, 255, 255, 255, 0])).toBe(
      'rgb(20 30 40)',
    );
    expect(averageColour([1, 2, 3, 0])).toBeUndefined();
    // A pixel the reader left a gap in counts as black.
    expect(averageColour({ length: 4, 3: 255 })).toBe('rgb(0 0 0)');
  });

  it('hands the frame the colour it read, no more often than a few times a second', () => {
    const frame = document.createElement('div');
    const read = vi.fn(() => ({ data: new Uint8ClampedArray([40, 50, 60, 255]) }));
    const ctx = { drawImage: vi.fn(), getImageData: read };
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    const scratch = document.createElement('canvas');
    tintFrame(frame, scratch, 100, 1000);
    expect(frame.style.getPropertyValue('--visit-tint')).toBe('rgb(40 50 60)');
    tintFrame(frame, scratch, 100, 1100);
    expect(read).toHaveBeenCalledTimes(1);
    ctx.drawImage.mockImplementation(() => {
      throw new Error('tainted');
    });
    tintFrame(frame, scratch, 100, 2000);
    expect(frame.style.getPropertyValue('--visit-tint')).toBe('rgb(40 50 60)');
    getContext.mockReturnValue(null);
    tintFrame(frame, scratch, 100, 3000);
    vi.restoreAllMocks();
  });
});
