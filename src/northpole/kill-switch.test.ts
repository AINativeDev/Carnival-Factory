import { describe, expect, it, vi } from 'vitest';

// The kill switch is read once, when the registries load, so the test closes
// a booth and an attraction, in any case, before importing them.
vi.mock('./disabled.json', () => ({
  default: { booths: ['JEDI4EVER'], attractions: ['Ferris-Wheel'], levels: [] },
}));

const { boothRegistry, plotFilesByLogin } = await import('./booths');
const { attractionRegistry } = await import('./attractions');

describe('the kill switch for booths and attractions', () => {
  it('closes a switched-off booth for repairs', () => {
    expect(boothRegistry.get('jedi4ever')?.description).toBe('Closed for repairs.');
  });

  it('closes a switched-off attraction for repairs', () => {
    expect(attractionRegistry.get('ferris-wheel')?.description).toBe('Closed for repairs.');
  });
});

describe("a booth's own plot.json", () => {
  it('is kept by its folder login when it holds a plot, and left out when it does not', () => {
    expect(
      plotFilesByLogin({
        '../../carnival/booths/ana/plot.json': { plot: 12, issue: 40 },
        '../../carnival/booths/bob/plot.json': { plot: 'twelve' },
      }),
    ).toEqual({ ana: { plot: 12, issue: 40 } });
  });
});
