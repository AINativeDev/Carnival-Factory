/**
 * Where a square's build story hangs in its room, and what each note on it
 * says: the request as a letter, each factory build as a blueprint stamped with
 * how its review went, and the map as a star. The panel beside the room tells
 * the same story in words (src/build-story.ts). Plain functions.
 */
import type { StoryStep } from '../build-story';
import type { Room } from './interior';
import type { Box } from './world';

/** The most notes the board holds: the latest ones, when a square has a long story. */
export const MAX_NOTES = 6;

/** One note on the board. */
export interface PinnedNote {
  paper: 'letter' | 'note' | 'blueprint' | 'star';
  title: string;
  line: string;
  /** What the review stamped on a build. */
  stamp?: string;
}

/** The board on the back wall, right of the stage, mirroring the portrait; none when there's no room. */
export function pinboardBox(room: Room): Box | undefined {
  const { stage, centre, backHalf } = room;
  const free = centre + backHalf - (stage.x + stage.w);
  const w = free * 0.86;
  const h = stage.h * 0.9;
  if (w < 60) return undefined;
  return { x: stage.x + stage.w + (free - w) / 2, y: stage.y + stage.h * 0.05, w, h };
}

/** A story step as a note. */
export function noteFor(step: StoryStep): PinnedNote {
  const title = step.link?.text ?? step.label;
  const who = step.who ? `@${step.who}` : '';
  switch (step.kind) {
    case 'asked':
      return { paper: 'letter', title, line: who };
    case 'changed':
      return { paper: 'note', title, line: who };
    case 'made':
      return { paper: 'letter', title: 'Made by', line: who };
    case 'live':
      return { paper: 'star', title: 'On the map', line: '' };
    case 'built': {
      if (step.meta === 'Open') return { paper: 'blueprint', title, line: 'Building' };
      const fixed = step.review?.fixed ?? 0;
      const stamp = (step.review?.findings ?? 0) === 0 ? 'Clean' : `${String(fixed)} fixed`;
      return { paper: 'blueprint', title, line: 'Built', stamp };
    }
  }
}

/** The notes to pin: every step's, or the latest ones when there are more than fit. */
/**
 * The notes that fit `capacity` places: the first request, so the board still
 * says who asked, then the latest steps, ending on the map.
 */
export function notesThatFit(notes: PinnedNote[], capacity: number): PinnedNote[] {
  if (notes.length <= capacity) return notes;
  return [...notes.slice(0, 1), ...notes.slice(notes.length - capacity + 1)];
}

export const pinnedNotes = (steps: StoryStep[]): PinnedNote[] =>
  notesThatFit(steps.map(noteFor), MAX_NOTES);
