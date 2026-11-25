/**
 * Who made a square and who improved it, from its history
 * (scripts/square-history.ts). Plain functions, so the crediting is tested.
 */
import { isNorthPoleLevel } from '../src/northpole/north-pole-levels.ts';
import type { Credits, HistoryEntry } from './square-history.ts';

/**
 * A square's credits, from its history: the authors of the requests whose
 * pull requests merged into its folder, each once, in the order they merged.
 * The history shows who changed a square, not who made it, so only a square
 * with an owner has a maker: a booth's or a participant's level's, whose login
 * names its folder. Everyone else improved it. Nothing for an attraction or
 * one of the North Pole's own levels the factory never built into.
 */
export function creditsOf(square: string, entries: HistoryEntry[]): Credits | undefined {
  const merged = entries
    .flatMap((entry) => {
      const times = entry.pulls.flatMap((pull) =>
        pull.state === 'merged' && pull.mergedAt ? [pull.mergedAt] : [],
      );
      const first = times.sort().at(0);
      return first ? [{ author: entry.author, at: first }] : [];
    })
    .sort((a, b) => a.at.localeCompare(b.at));
  const people: string[] = [];
  for (const { author } of merged) {
    if (!people.some((login) => login.toLowerCase() === author.toLowerCase())) people.push(author);
  }
  const [kind, id = ''] = square.split('/');
  const owned = id && (kind === 'booth' || (kind === 'level' && !isNorthPoleLevel(id)));
  if (!owned) return people.length ? { improvers: people } : undefined;
  const maker = people.find((login) => login.toLowerCase() === id) ?? id;
  return { maker, improvers: people.filter((login) => login !== maker) };
}
