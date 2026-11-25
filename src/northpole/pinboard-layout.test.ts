import { describe, expect, it } from 'vitest';
import type { StoryStep } from '../build-story';
import { roomArea, roomLayout } from './interior';
import { MAX_NOTES, noteFor, pinboardBox, pinnedNotes } from './pinboard-layout';

const room = roomLayout(roomArea(1200, 800));

describe('pinboardBox: where the build story hangs', () => {
  it('hangs on the back wall right of the stage, clear of it and the wall edge', () => {
    const box = pinboardBox(room);
    expect(box).toBeDefined();
    if (!box) return;
    expect(box.x).toBeGreaterThan(room.stage.x + room.stage.w);
    expect(box.x + box.w).toBeLessThan(room.centre + room.backHalf);
    expect(box.y).toBeGreaterThanOrEqual(room.stage.y);
    expect(box.y + box.h).toBeLessThanOrEqual(room.stage.y + room.stage.h);
  });

  it("doesn't hang where there's no room for it, as on a narrow phone", () => {
    expect(pinboardBox(roomLayout(roomArea(200, 300)))).toBeUndefined();
  });
});

const step = (kind: StoryStep['kind'], extra: Partial<StoryStep> = {}): StoryStep => ({
  kind,
  label: kind,
  ...extra,
});

describe('noteFor: each step as a note on the board', () => {
  it('pins a request as a letter, a build as a blueprint, and the map as a star', () => {
    expect(noteFor(step('asked', { who: 'ana', link: { href: '', text: '#70' } }))).toEqual({
      paper: 'letter',
      title: '#70',
      line: '@ana',
    });
    expect(noteFor(step('changed', { who: 'bo', link: { href: '', text: '#9' } }))).toEqual({
      paper: 'note',
      title: '#9',
      line: '@bo',
    });
    expect(
      noteFor(
        step('built', { link: { href: '', text: '#72' }, review: { findings: 2, fixed: 2 } }),
      ),
    ).toEqual({ paper: 'blueprint', title: '#72', line: 'Built', stamp: '2 fixed' });
    expect(noteFor(step('live'))).toEqual({ paper: 'star', title: 'On the map', line: '' });
    expect(noteFor(step('made', { who: 'ana' }))).toEqual({
      paper: 'letter',
      title: 'Made by',
      line: '@ana',
    });
  });

  it('stamps a clean review as such, and leaves a build in progress unstamped', () => {
    const clean = step('built', {
      link: { href: '', text: '#5' },
      review: { findings: 0, fixed: 0 },
    });
    expect(noteFor(clean).stamp).toBe('Clean');
    expect(noteFor(step('built', { link: { href: '', text: '#5' } })).stamp).toBe('Clean');
    const open = step('built', {
      link: { href: '', text: '#6' },
      meta: 'Open',
      review: { findings: 1, fixed: 0 },
    });
    expect(noteFor(open)).toMatchObject({ line: 'Building' });
    expect(noteFor(open).stamp).toBeUndefined();
  });
});

describe('pinnedNotes', () => {
  it('pins the first request and the most recent steps when there are more than fit', () => {
    const many = Array.from({ length: 9 }, (_, n) =>
      step('changed', { link: { href: '', text: `#${String(n)}` } }),
    );
    const notes = pinnedNotes(many);
    expect(notes).toHaveLength(MAX_NOTES);
    expect(notes.map((note) => note.title)).toEqual(['#0', '#4', '#5', '#6', '#7', '#8']);
  });
});
