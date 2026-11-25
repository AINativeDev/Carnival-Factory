import { describe, expect, it } from 'vitest';
import { creditsOf } from './square-credits.ts';

const REPO = 'https://github.com/o/r';

describe('creditsOf', () => {
  const entry = (author: string, pulls: { state: 'merged' | 'open'; mergedAt?: string }[]) => ({
    issue: 1,
    title: 'Request',
    url: `${REPO}/issues/1`,
    author,
    openedAt: '2026-11-01T10:00:00Z',
    decision: 'accepted' as const,
    pulls: pulls.map((p, n) => ({ number: n, url: '', findings: 0, fixed: 0, commits: 1, ...p })),
  });

  it('orders people by when their change first merged, and names each once', () => {
    expect(
      creditsOf('attraction/ferris-wheel', [
        entry('bob', [{ state: 'merged', mergedAt: '2026-11-03T00:00:00Z' }]),
        entry('ana', [{ state: 'merged', mergedAt: '2026-11-02T00:00:00Z' }]),
        entry('Bob', [{ state: 'merged', mergedAt: '2026-11-05T00:00:00Z' }]),
        entry('ANA', [{ state: 'merged', mergedAt: '2026-11-04T00:00:00Z' }]),
      ]),
    ).toEqual({ improvers: ['ana', 'bob'] });
  });

  it("makes a booth's owner its maker, even when someone else's change merged first", () => {
    const merged = (author: string, day: number) =>
      entry(author, [{ state: 'merged', mergedAt: `2026-11-0${day}T00:00:00Z` }]);
    expect(creditsOf('booth/ana', [merged('maintainer', 1), merged('Ana', 2)])).toEqual({
      maker: 'Ana',
      improvers: ['maintainer'],
    });
    expect(creditsOf('booth/ana', [merged('maintainer', 1)])).toEqual({
      maker: 'ana',
      improvers: ['maintainer'],
    });
  });

  it('credits nobody for requests that never merged, but a booth still has its owner', () => {
    const none = [entry('ana', [{ state: 'open' }]), entry('bob', [])];
    expect(creditsOf('attraction/ferris-wheel', none)).toBeUndefined();
    expect(creditsOf('booth/bob', none)).toEqual({ maker: 'bob', improvers: [] });
  });

  it("makes a participant's level its owner's, and the North Pole's own levels nobody's", () => {
    const merged = entry('maintainer', [{ state: 'merged', mergedAt: '2026-11-02T00:00:00Z' }]);
    expect(creditsOf('level/ana', [merged])).toEqual({ maker: 'ana', improvers: ['maintainer'] });
    expect(creditsOf('level/ana', [])).toEqual({ maker: 'ana', improvers: [] });
    expect(creditsOf('level/the-factory', [merged])).toEqual({ improvers: ['maintainer'] });
    expect(creditsOf('level/the-factory', [])).toBeUndefined();
  });

  it('credits no maker for a key without an id', () => {
    expect(creditsOf('booth', [])).toBeUndefined();
  });
});
