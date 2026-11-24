import { describe, expect, it } from 'vitest';
import { decideUpdate, QUIET_RELOAD_MS } from './updates';

describe('decideUpdate', () => {
  it('does nothing when the page is the published build', () => {
    expect(decideUpdate('abc', 'abc', 0)).toBe('none');
  });

  it('does nothing when the published build is unknown, or while developing', () => {
    expect(decideUpdate('abc', undefined, 0)).toBe('none');
    expect(decideUpdate('dev', 'abc', 0)).toBe('none');
  });

  it('reloads quietly when the page has only just opened', () => {
    expect(decideUpdate('old', 'new', QUIET_RELOAD_MS - 1)).toBe('reload');
  });

  it('offers the new build to someone already looking around', () => {
    expect(decideUpdate('old', 'new', QUIET_RELOAD_MS)).toBe('offer');
  });

  it('never reloads again once it has asked for that build, so a stale cache cannot loop', () => {
    expect(decideUpdate('old', 'new', 0, 'new')).toBe('offer');
    expect(decideUpdate('old', 'newer', 0, 'new')).toBe('reload');
  });
});
