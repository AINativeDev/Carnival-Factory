import { describe, expect, it } from 'vitest';
import { seasonHeadline, seasonLines, seasonShareText } from './season';
import { switchFlags } from './test-support/feature-flags';

describe('seasonLines', () => {
  it('shows only the numbers that apply', () => {
    expect(seasonLines({ requests: 3, shipped: 2, findingsFixed: 0 })).toEqual([
      { value: 3, label: 'requests made' },
      { value: 2, label: 'requests shipped' },
    ]);
  });

  it('counts one in the singular', () => {
    expect(seasonLines({ requests: 1, shipped: 1, findingsFixed: 1, votes: 1 })).toEqual([
      { value: 1, label: 'request made' },
      { value: 1, label: 'request shipped' },
      { value: 1, label: 'review finding fixed' },
      { value: 1, label: 'vote received' },
    ]);
  });

  it('leaves the advent challenges out while their feature flag is off', () => {
    expect(seasonLines({ requests: 0, shipped: 0, findingsFixed: 0, advent: 4 })).toEqual([]);
  });

  describe('with the advent calendar switched on', () => {
    switchFlags({ advent: true });
    it('adds featured, votes and advent challenges once they have numbers', () => {
      const lines = seasonLines({
        requests: 1,
        shipped: 1,
        findingsFixed: 0,
        featured: 2,
        votes: 5,
        advent: 4,
      });
      expect(lines.map((line) => line.label)).toEqual([
        'request made',
        'request shipped',
        'times featured',
        'votes received',
        'advent challenges done',
      ]);
    });
  });

  it('has nothing to show for someone with no season counted', () => {
    expect(seasonLines(undefined)).toEqual([]);
    expect(seasonLines({ requests: 0, shipped: 0, findingsFixed: 0 })).toEqual([]);
  });
});

describe('seasonHeadline', () => {
  it('welcomes a participant with little to show', () => {
    expect(seasonHeadline([])).toBe('My first season at the North Pole');
    expect(seasonHeadline([{ value: 1, label: 'request made' }])).toBe(
      'My season at the North Pole',
    );
  });
});

describe('seasonShareText', () => {
  const link = 'https://example.github.io/carnival/#/?booth=sjmaple';

  it('says what shipped, with the link to the booth on the map', () => {
    expect(
      seasonShareText('sjmaple', 'Sled Shed', { requests: 2, shipped: 2, findingsFixed: 1 }, link),
    ).toBe(
      `My season at Carnival Factory as @sjmaple: I shipped 2 requests to Sled Shed. Come visit: ${link}`,
    );
  });

  it('still has something to say for a booth with no season counted', () => {
    expect(seasonShareText('sjmaple', 'Sled Shed', undefined, link)).toBe(
      `My season at Carnival Factory as @sjmaple: I built Sled Shed. Come visit: ${link}`,
    );
  });
});
