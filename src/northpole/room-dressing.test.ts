import { describe, expect, it } from 'vitest';
import type { SquareHistory } from '../../scripts/square-history';
import { drawingOf } from '../test-support/recording-canvas';
import { roomArea, roomLayout } from './interior';
import { dressRoom, roomNotes } from './room-dressing';

const history: SquareHistory = {
  builtAt: '',
  squares: {
    'booth/ana': [
      {
        issue: 7,
        title: 'My booth',
        url: 'https://github.com/o/r/issues/7',
        author: 'ana',
        openedAt: '2026-11-24T10:00:00Z',
        decision: 'accepted',
        pulls: [
          {
            number: 8,
            url: 'https://github.com/o/r/pull/8',
            state: 'merged',
            findings: 3,
            fixed: 3,
            commits: 2,
            mergedAt: '2026-11-24T12:00:00Z',
          },
        ],
      },
    ],
  },
  credits: {},
};

describe('roomNotes', () => {
  it("pins a booth's request, its build stamped with the review, and the map", () => {
    expect(roomNotes({ kind: 'booth', id: 'Ana' }, history).map((note) => note.paper)).toEqual([
      'letter',
      'blueprint',
      'star',
    ]);
    expect(roomNotes({ kind: 'booth', id: 'ana' }, history)[1]?.stamp).toBe('3 fixed');
  });

  it('credits the owner when there is no history, and pins nothing for a level square', () => {
    expect(roomNotes({ kind: 'booth', id: 'bo' }, undefined).map((note) => note.title)).toEqual([
      'Made by',
      'On the map',
    ]);
    expect(roomNotes({ kind: 'level', id: 'bo' }, history)).toEqual([]);
    expect(roomNotes({ kind: 'booth' }, history)).toEqual([]);
  });
});

describe('dressRoom', () => {
  it('dresses the walls, the window, the glow, the doorway and the board', () => {
    const room = roomLayout(roomArea(1200, 800));
    const square = {
      id: 'ana',
      name: 'Ana',
      description: '',
      draw: () => undefined,
      stall: { shape: 'cabin' as const, roof: 'gold' as const },
    };
    const calls = drawingOf((ctx) => {
      dressRoom(ctx, room, square, { kind: 'booth', id: 'ana' }, 2);
    });
    const names = calls.map(([name]) => name);
    expect(names).toContain('createRadialGradient');
    expect(names).toContain('ellipse');
    expect(calls.filter(([name]) => name === 'fillText').map(([, text]) => text)).toContain(
      'How it was built',
    );
  });
});
