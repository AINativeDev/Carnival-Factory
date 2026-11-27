import { describe, expect, it, vi } from 'vitest';
import { attractionShown, readFeatureFlags } from './feature-flag-names';

const ALL_OFF = {
  remix: false,
  elfEngineer: false,
  giftShop: false,
  advent: false,
  levels: false,
  yearInReview: false,
  peoplesChoice: false,
};

describe('readFeatureFlags', () => {
  it('switches every feature flag off when the build names none', () => {
    expect(readFeatureFlags(undefined)).toEqual(ALL_OFF);
    expect(readFeatureFlags('')).toEqual(ALL_OFF);
  });

  it('switches on the flags a comma-separated list names, and ignores names it does not know', () => {
    expect(readFeatureFlags(' remix , advent,snowball')).toEqual({
      ...ALL_OFF,
      remix: true,
      advent: true,
    });
  });
});

describe('attractionShown', () => {
  it('hides the Gift Shop while its feature flag is off', () => {
    expect(attractionShown('gift-shop', ALL_OFF)).toBe(false);
    expect(attractionShown('gift-shop', { ...ALL_OFF, giftShop: true })).toBe(true);
  });

  it('hides the Year in Review while its feature flag is off', () => {
    expect(attractionShown('the-year-in-review', ALL_OFF)).toBe(false);
    expect(attractionShown('the-year-in-review', { ...ALL_OFF, yearInReview: true })).toBe(true);
  });

  it('shows every attraction no flag holds back', () => {
    expect(attractionShown('ferris-wheel', ALL_OFF)).toBe(true);
  });
});

describe('the attractions held back, as the page first loads them', () => {
  it('are the Gift Shop and the Year in Review, each behind its own flag', async () => {
    vi.resetModules();
    const fresh = await import('./feature-flag-names');
    expect(fresh.attractionShown('gift-shop', { ...ALL_OFF, yearInReview: true })).toBe(false);
    expect(fresh.attractionShown('the-year-in-review', { ...ALL_OFF, giftShop: true })).toBe(false);
    expect(fresh.attractionShown('gift-shop', { ...ALL_OFF, giftShop: true })).toBe(true);
  });
});
