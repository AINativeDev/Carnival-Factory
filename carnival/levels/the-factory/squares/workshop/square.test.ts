import { describe, expect, it } from 'vitest';
import { BUILD, PARTS, partsBuilt } from './square';

describe('partsBuilt', () => {
  it('builds one part a beat, holds the finished booth, then starts again', () => {
    const beat = BUILD / (PARTS + 1);
    expect(partsBuilt(0)).toBe(0);
    expect(partsBuilt(beat * 1.5)).toBe(1);
    expect(partsBuilt(beat * 4.5)).toBe(PARTS);
    expect(partsBuilt(BUILD - 1)).toBe(PARTS);
    expect(partsBuilt(BUILD)).toBe(0);
  });
});
