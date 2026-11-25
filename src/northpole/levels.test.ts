import { describe, expect, it, vi } from 'vitest';

// The kill switch is read once, when the levels load, so the test switches
// The Factory off before importing them.
vi.mock('./disabled.json', () => ({
  default: { booths: [], attractions: [], levels: ['The-Factory'] },
}));

const { levels } = await import('./levels');

describe('the kill switch for levels', () => {
  it('closes a switched-off level, runs none of its squares, and keeps its credit', () => {
    expect(levels.find((entry) => entry.login === 'the-factory')).toEqual({
      login: 'the-factory',
      name: 'the-factory',
      description: '',
      owner: 'the North Pole',
      squares: [],
      closed: 'off',
    });
  });

  it('leaves the other levels open', () => {
    const starter = levels.find((entry) => entry.login === 'jedi4ever');
    expect(starter?.closed).toBeUndefined();
    expect(starter?.owner).toBe('@jedi4ever');
  });
});
