import { describe, expect, it } from 'vitest';
import { ADVENT_CALENDAR, adventDoors, adventNote } from './advent';

describe('adventDoors', () => {
  it('keeps every door shut before December', () => {
    const doors = adventDoors(ADVENT_CALENDAR, new Date(ADVENT_CALENDAR.year, 10, 30, 23, 59));
    expect(doors).toHaveLength(24);
    expect(doors.every((door) => !door.open)).toBe(true);
  });

  it('opens the doors up to today, and only those', () => {
    const doors = adventDoors(ADVENT_CALENDAR, new Date(ADVENT_CALENDAR.year, 11, 5, 9));
    expect(doors.filter((door) => door.open).map((door) => door.day)).toEqual([1, 2, 3, 4, 5]);
    const fifth = doors[4];
    expect(fifth.open && fifth.challenge.title).toBe(ADVENT_CALENDAR.challenges[4].title);
    expect(doors[5]).toEqual({ day: 6, open: false });
  });

  it('keeps every door open after the season', () => {
    const doors = adventDoors(ADVENT_CALENDAR, new Date(ADVENT_CALENDAR.year + 1, 0, 2));
    expect(doors.every((door) => door.open)).toBe(true);
  });
});

describe('adventNote', () => {
  const at = (month: number, day: number) =>
    adventNote(adventDoors(ADVENT_CALENDAR, new Date(2026, month, day)), 2026);

  it('says when the first door opens, how many are open, or that all are', () => {
    expect(at(10, 24)).toBe('The first door opens on 1 December 2026.');
    expect(at(11, 3)).toBe('3 of 24 doors are open. The next one opens tomorrow.');
    expect(at(11, 24)).toBe('All 24 doors are open.');
  });
});
