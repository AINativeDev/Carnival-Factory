import { describe, expect, it } from 'vitest';
import { readLinkAsk } from './square-ask';

describe("a drawing's ask for a link out", () => {
  it('is a whole number of one of its links, and nothing else', () => {
    expect(readLinkAsk({ open: 0 })).toBe(0);
    expect(readLinkAsk({ open: 7 })).toBe(7);
    for (const open of [8, -1, 1.5, Number.NaN, '0', undefined])
      expect(readLinkAsk({ open })).toBeUndefined();
    expect(readLinkAsk(undefined)).toBeUndefined();
    expect(readLinkAsk(null)).toBeUndefined();
    expect(readLinkAsk(0)).toBeUndefined();
  });
});
