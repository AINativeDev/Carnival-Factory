import { describe, expect, it } from 'vitest';
import { GIFTS, GIFT_SOURCE, SHOW, inSpotlight, installCommand } from './attraction';

describe('the gift shelf', () => {
  it('holds four to six gifts, each its own skill', () => {
    expect(GIFTS.length).toBeGreaterThanOrEqual(4);
    expect(GIFTS.length).toBeLessThanOrEqual(6);
    expect(new Set(GIFTS.map((g) => g.skill)).size).toBe(GIFTS.length);
  });
});

describe('inSpotlight', () => {
  it('shows each gift in turn, then starts again', () => {
    const shown = GIFTS.map((_, i) => inSpotlight(i * SHOW + SHOW / 2));
    expect(shown).toEqual(GIFTS.map((_, i) => i));
    expect(inSpotlight(GIFTS.length * SHOW)).toBe(0);
  });

  it('keeps a gift in the spotlight for its whole turn', () => {
    expect(inSpotlight(SHOW + 1)).toBe(inSpotlight(2 * SHOW - 1));
  });
});

describe('installCommand', () => {
  it('installs one skill straight from GitHub', () => {
    expect(installCommand('tidy-elf')).toBe(`tessl install ${GIFT_SOURCE} --skill tidy-elf`);
    expect(GIFT_SOURCE.startsWith('github:')).toBe(true);
  });
});
