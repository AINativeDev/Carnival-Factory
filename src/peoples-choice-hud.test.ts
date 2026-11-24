import { describe, expect, it } from 'vitest';
import { closingLine, topLine } from './peoples-choice-hud';

const DISCUSSION = 'https://github.com/AINativeDev/Northpole-Carnival-Factory/discussions/7';
const entry = (login: string, votes: number) => ({ login, url: DISCUSSION, votes });

describe('topLine', () => {
  it('names the top three booths and the home factory leader', () => {
    expect(
      topLine({
        discussion: DISCUSSION,
        booths: [entry('a', 3), entry('b', 2), entry('c', 1), entry('d', 1)],
        factories: [entry('f', 2), entry('g', 0)],
      }),
    ).toBe('🏆 @a, @b, @c, @d · Home factory: @f');
  });

  it('says when nobody has voted yet', () => {
    expect(topLine({ discussion: DISCUSSION, booths: [entry('a', 0)], factories: [] })).toBe(
      'No votes yet',
    );
  });
});

describe('closingLine', () => {
  it('says when voting closes, and that it closed', () => {
    const closes = '2026-12-31T23:59:59Z';
    expect(closingLine(new Date('2026-12-01T00:00:00Z'), closes)).toContain(
      'Voting closes on 31 Dec 2026.',
    );
    expect(closingLine(new Date('2027-01-02T00:00:00Z'), closes)).toBe(
      'Voting closed on 31 Dec 2026.',
    );
  });
});
