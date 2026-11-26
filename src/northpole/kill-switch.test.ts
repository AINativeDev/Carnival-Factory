import { describe, expect, it, vi } from 'vitest';

// The kill switch is read once, when the registries load, so the test closes
// a booth and an attraction, in any case, before importing them.
vi.mock('./disabled.json', () => ({
  default: { booths: ['JEDI4EVER'], attractions: ['Ferris-Wheel'], levels: [] },
}));

const { boothRegistry, spotFilesByLogin } = await import('./booths');
const { attractionRegistry } = await import('./attractions');

describe('the kill switch for booths and attractions', () => {
  it('closes a switched-off booth for repairs', () => {
    expect(boothRegistry.get('jedi4ever')?.description).toBe('Closed for repairs.');
  });

  it('closes a switched-off attraction for repairs', () => {
    expect(attractionRegistry.get('ferris-wheel')?.description).toBe('Closed for repairs.');
  });
});

describe("a booth's own spot.json", () => {
  it('is kept by its folder login when it holds a spot, and left out when it does not', () => {
    expect(
      spotFilesByLogin({
        '../../carnival/booths/ana/spot.json': { spot: 12, issue: 40 },
        '../../carnival/booths/bob/spot.json': { spot: 'twelve' },
      }),
    ).toEqual({ ana: { spot: 12, issue: 40 } });
  });
});
