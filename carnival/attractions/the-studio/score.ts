/**
 * How an episode went: its grade, and the waveform the playback shows, built
 * from the words said (loud where they were said on the beat, a murmur where
 * they were missed).
 */
import type { Game, Judge } from './game';

/** The waveform's bars. */
export const SLOTS = 44;

/** How much each verdict counts towards the grade, and how loud it plays back. */
const weight = (judge: Judge) => (judge === 'perfect' ? 1 : judge === 'good' ? 0.6 : 0);

/** A steady pseudo-random number from 0 to 1 for `n`: the same every frame, so nothing jitters. */
export const wobble = (n: number) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43_758.5453;
  return s - Math.floor(s);
};

/** How many of the episode's words were said, weighted: 1 if every one was perfect. */
export function accuracy(game: Game): number {
  const total = game.hits.reduce((sum, hit) => sum + (hit ? weight(hit.judge) : 0), 0);
  return game.beats.length ? total / game.beats.length : 0;
}

/** `points` with a comma between each three digits, as the scoreboard shows it: 12,400. */
export const grouped = (points: number) => String(points).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** How many of the episode's words were said, good or perfect. */
export const saidCount = (game: Game) =>
  game.hits.filter((hit) => hit !== null && hit.judge !== 'miss').length;

/** The episode's grade, its letter and what the studio calls it. */
export function grade(game: Game): { letter: string; title: string } {
  if (game.lost) return { letter: '✕', title: 'Signal lost' };
  const score = accuracy(game);
  if (score >= 0.9) return { letter: 'S', title: 'Chart-topper' };
  if (score >= 0.75) return { letter: 'A', title: 'Fan favorite' };
  if (score >= 0.55) return { letter: 'B', title: 'Solid episode' };
  return { letter: 'C', title: 'Needs an edit' };
}

/** The waveform of what was recorded: a bar per slice of the episode, from 0 to 1. */
export function waveOf(game: Game): number[] {
  const length = (game.ended ?? game.start) - game.start;
  return Array.from({ length: SLOTS }, (_, slot) => {
    const at = ((slot + 0.5) / SLOTS) * length;
    let level = 0.05 + wobble(slot) * 0.06;
    game.beats.forEach((beat, n) => {
      const hit = game.hits.at(n);
      if (!hit || hit.judge === 'miss') return;
      // A word sounds from its beat for a moment, or for as long as it was held.
      const lasts = 260 + beat.hold * hit.held;
      if (at >= beat.at - 60 && at <= beat.at + lasts)
        level = Math.max(level, weight(hit.judge) * (0.75 + wobble(slot + n * 3) * 0.25));
    });
    return level;
  });
}

/** How loud the host is while recording at `time`: a word just said rings out, a long word held stays loud. */
export function voice(game: Game, time: number): number {
  if (game.holding !== null) return 0.8;
  return game.hits.reduce((loud, hit) => {
    const age = hit && hit.judge !== 'miss' ? (time - hit.at) / 300 : 1;
    return age >= 0 && age < 1 && hit ? Math.max(loud, weight(hit.judge) * (1 - age)) : loud;
  }, 0);
}
