/**
 * How a square was built, as a story read top to bottom: who asked for it, what
 * the factory built and how its review went, each change since, and the moment
 * it reached the map. This is the point of the whole carnival, so the visit
 * panel leads with it (docs/specs/visit-panel-and-history.md). Plain functions
 * over the history the build bakes in.
 */
import type { Credits, HistoryEntry, HistoryPull } from '../scripts/square-history';
import { day, decisionText, pullState, pullSummary } from './history';

/** One step of the story. */
export interface StoryStep {
  kind: 'asked' | 'changed' | 'built' | 'made' | 'live';
  label: string;
  /** Whose step it is, as a GitHub login. */
  who?: string;
  /** The issue or pull request it happened in. */
  link?: { href: string; text: string };
  /** What was asked for, or how the review went. */
  detail?: string;
  /** When, and where it stands. */
  meta?: string;
  /** An open pull request's preview of the square. */
  preview?: string;
}

/** What the factory did in one pull request: the first build, a later improvement, or one in progress. */
function builtStep(pull: HistoryPull, first: boolean): StoryStep {
  const label =
    pull.state === 'open'
      ? 'Being built by the factory'
      : first
        ? 'Built by the factory'
        : 'Improved by the factory';
  return {
    kind: 'built',
    label,
    link: { href: pull.url, text: `#${String(pull.number)}` },
    detail: pullSummary(pull),
    meta: pullState(pull),
    ...(pull.preview ? { preview: pull.preview } : {}),
  };
}

/**
 * The story from the build's history, which lists requests and their pull
 * requests newest first. Without any history, as in a preview, it says who
 * made the square, when anyone did.
 */
export function storySteps(history: HistoryEntry[], credits: Credits | undefined): StoryStep[] {
  if (history.length === 0) {
    return credits?.maker
      ? [
          { kind: 'made', label: 'Made by', who: credits.maker },
          { kind: 'live', label: 'On the map' },
        ]
      : [];
  }
  const steps: StoryStep[] = [];
  // Whether a pull request merged yet: the next build after it is an improvement.
  let built = false as boolean;
  [...history].reverse().forEach((entry, index) => {
    steps.push({
      kind: index === 0 ? 'asked' : 'changed',
      label: index === 0 ? 'Asked for by' : 'Change asked for by',
      who: entry.author,
      link: { href: entry.url, text: `#${String(entry.issue)}` },
      detail: entry.title,
      meta: `${day(entry.openedAt)} · ${decisionText(entry.decision)}`,
    });
    for (const pull of [...entry.pulls].reverse()) {
      steps.push(builtStep(pull, !built));
      if (pull.state === 'merged') built = true;
    }
  });
  if (built) steps.push({ kind: 'live', label: 'On the map' });
  return steps;
}
