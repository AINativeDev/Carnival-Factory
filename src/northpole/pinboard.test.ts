import { describe, expect, it } from 'vitest';
import { drawingOf } from '../test-support/recording-canvas';
import { roomArea, roomLayout } from './interior';
import { drawPinboard } from './pinboard';
import type { PinnedNote } from './pinboard-layout';

const room = roomLayout(roomArea(1200, 800));
const notes: PinnedNote[] = [
  { paper: 'letter', title: '#70', line: '@ana' },
  { paper: 'blueprint', title: '#72', line: 'Built', stamp: '2 fixed' },
  { paper: 'note', title: '#90', line: '@bo' },
  { paper: 'star', title: 'On the map', line: '' },
];

describe('drawPinboard', () => {
  it("pins every note, with its title, its line and a build's stamp", () => {
    const calls = drawingOf((ctx) => {
      drawPinboard(ctx, room, notes);
    });
    const texts = calls.filter(([name]) => name === 'fillText').map(([, text]) => text);
    expect(texts).toEqual(
      expect.arrayContaining([
        'How it was built',
        '#70',
        '@ana',
        '#72',
        '2 fixed',
        '#90',
        'On the map',
      ]),
    );
  });

  it('keeps the first request and the latest steps when there are more than fit', () => {
    const more: PinnedNote[] = [{ paper: 'note', title: '#60', line: '' }, ...notes];
    const calls = drawingOf((ctx) => {
      drawPinboard(ctx, room, more);
    });
    const texts = calls.filter(([name]) => name === 'fillText').map(([, text]) => text);
    expect(texts).toEqual(expect.arrayContaining(['#60', '#72', '#90', 'On the map']));
    expect(texts).not.toContain('#70');
  });

  it('draws nothing without notes, or without room on the wall', () => {
    expect(
      drawingOf((ctx) => {
        drawPinboard(ctx, room, []);
      }),
    ).toEqual([]);
    const narrow = roomLayout(roomArea(200, 300));
    expect(
      drawingOf((ctx) => {
        drawPinboard(ctx, narrow, notes);
      }),
    ).toEqual([]);
  });
});
