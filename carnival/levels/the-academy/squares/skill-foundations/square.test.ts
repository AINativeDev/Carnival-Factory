import { describe, expect, it } from 'vitest';
import { BLOCKS, blocksStacked, STACK } from './square';

describe('blocksStacked', () => {
  it('stacks one block a beat, holds the whole skill, then starts again', () => {
    const beat = STACK / (BLOCKS.length + 1);
    expect(blocksStacked(0)).toBe(0);
    expect(blocksStacked(beat * 1.5)).toBe(1);
    expect(blocksStacked(STACK - 1)).toBe(BLOCKS.length);
    expect(blocksStacked(STACK)).toBe(0);
  });
});
