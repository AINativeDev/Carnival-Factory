/**
 * The Factory's tour: what each of its stalls explains, one step of how a
 * booth gets built, with a link to the real thing (ADR 0035). The squares
 * draw each step; this is the page's own fixed text, so it's the panel that
 * carries the links, never a square's code.
 */
import { BOOTH_REQUEST_URL, CLAIM_URL, REPO_URL } from './northpole/links';

interface TourStop {
  story: string;
  label: string;
  href: string;
}

const FILE = `${REPO_URL}/blob/main`;

/** Each stall of The Factory, in the order the path passes them, by its square's id. */
export const FACTORY_TOUR: Readonly<Record<string, TourStop>> = {
  'letter-box': {
    story:
      'Every booth starts as a letter: someone fills in the booth form on GitHub and says what they would like. The issue is the whole spec, written in plain words.',
    label: 'Open the booth form',
    href: BOOTH_REQUEST_URL,
  },
  'assessment-desk': {
    story:
      'An agent reads the request first. It accepts it, asks a question when something is missing, or declines it when it is not something a family-friendly booth can be.',
    label: 'Read how requests are assessed',
    href: `${FILE}/plugins/north-pole/skills/assess-booth-request/SKILL.md`,
  },
  workshop: {
    story:
      'Once accepted, the factory builds the booth in a folder of its own, carnival/booths/<login>/, and opens a pull request. The booth may only change that folder.',
    label: 'See every booth’s folder',
    href: `${REPO_URL}/tree/main/carnival/booths`,
  },
  'inspection-bench': {
    story:
      'Review lenses read the pull request for the house rules and the craft, and the checks lint it, test it and play it in a real browser. What they find is fixed before it goes on.',
    label: 'See the house-rules lens',
    href: `${FILE}/plugins/north-pole/skills/review-house-rules/SKILL.md`,
  },
  gate: {
    story:
      'The merge gate lets a booth through on its own only when every check passes, the review approves and the change is low risk. Anything else waits for a person to look.',
    label: 'Read the merge gate',
    href: `${FILE}/docs/specs/auto-merge-gate.md`,
  },
  map: {
    story:
      'Merged, the booth goes live: the next deploy builds the map and puts it on its spot, where it was being built. Then anyone can walk up and visit it.',
    label: 'How your request is built',
    href: `${FILE}/docs/how-it-works.md`,
  },
};

/** Fills a Factory stall's panel help with its step of the tour and its link, all fixed text. */
export function fillTourStop(help: Element, id: string) {
  // Only its own stops: an id such as `constructor` is no stop of the tour.
  const stop = Object.hasOwn(FACTORY_TOUR, id) ? FACTORY_TOUR[id] : undefined;
  const more = `<a href="#/factory">See the factory’s numbers</a> <span aria-hidden="true">·</span> <a href="${CLAIM_URL}" target="_blank" rel="noopener">Get a booth</a>`;
  help.innerHTML = stop
    ? `<p class="tour-story">${stop.story.replace('<login>', '&lt;login&gt;')}</p>
      <p><a class="tour-link" href="${stop.href}" target="_blank" rel="noopener">${stop.label}</a> <span aria-hidden="true">·</span> ${more}</p>`
    : `<p>This square belongs to the North Pole’s own level. ${more}</p>`;
}
