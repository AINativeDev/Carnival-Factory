import { describe, expect, it, vi } from 'vitest';

/**
 * The letters' rule as the page first loads it: other tests load this module
 * afresh too, so each test here does the same, to hold the rule itself.
 */
const letters = async () => {
  vi.resetModules();
  return (await import('./stall-style')).LANDMARK_LETTERS;
};

describe("a tower landmark's letters", () => {
  it('are one to six capitals', async () => {
    const rule = await letters();
    expect(['T', 'TESSL', 'ABCDEF'].filter((text) => rule.test(text))).toEqual([
      'T',
      'TESSL',
      'ABCDEF',
    ]);
  });

  it('are nothing else: not empty, not seven, nothing before or after them', async () => {
    const rule = await letters();
    for (const text of ['', 'ABCDEFG', 'tessl', 'aTESSL', 'TESSLa', 'TE SSL', '1'])
      expect(rule.test(text), text).toBe(false);
  });
});
