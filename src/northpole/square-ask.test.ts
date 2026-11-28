import { describe, expect, it } from 'vitest';
import { readAsk, readLinkAsk, readVisitAsk } from './square-ask';

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

describe("a drawing's ask to visit a place", () => {
  it('is a plain place id, in lower case, of up to 40 letters, digits and dashes', () => {
    expect(readVisitAsk({ visit: 'the-academy' })).toBe('the-academy');
    expect(readVisitAsk({ visit: 'a'.repeat(40) })).toBe('a'.repeat(40));
    expect(readVisitAsk({ visit: 'ai-devcon2' })).toBe('ai-devcon2');
    for (const visit of ['', 'a'.repeat(41), 'The-Academy', 'x/../y', 'a b', 'ok\n', 7, undefined])
      expect(readVisitAsk({ visit }), String(visit)).toBeUndefined();
    expect(readVisitAsk('the-academy')).toBeUndefined();
    expect(readVisitAsk(null)).toBeUndefined();
  });

  it('matches the whole id, not a part of it', () => {
    expect(readVisitAsk({ visit: '#the-academy' })).toBeUndefined();
    expect(readVisitAsk({ visit: 'the-academy#' })).toBeUndefined();
  });
});

describe("a drawing's whole ask", () => {
  it('keeps the link, the place, both, or is nothing', () => {
    expect(readAsk({ open: 1 })).toEqual({ open: 1 });
    expect(readAsk({ visit: 'the-studio' })).toEqual({ visit: 'the-studio' });
    expect(readAsk({ open: 0, visit: 'the-studio', extra: true })).toEqual({
      open: 0,
      visit: 'the-studio',
    });
    expect(readAsk({ open: 9, visit: '' })).toBeUndefined();
    expect(readAsk(undefined)).toBeUndefined();
  });
});
