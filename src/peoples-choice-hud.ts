import { factoryUrl } from './northpole/badges';
import {
  VOTING_CLOSES,
  leaders,
  places,
  votingClosed,
  type ChoiceEntry,
  type PeoplesChoice,
} from './northpole/peoples-choice';
import { day } from './history';

/** The People's Choice list's markup, below the map. Every login goes in later, as text. */
export const CHOICE_PANEL = `
  <details class="choice" hidden>
    <summary><span class="choice-title">People's Choice</span> <span class="choice-top"></span></summary>
    <div class="choice-body">
      <p class="choice-note"><span class="choice-when"></span> <a class="choice-ballot" target="_blank" rel="noopener">Vote on GitHub</a></p>
      <div class="choice-lists">
        <section>
          <h2 class="choice-group">Booths</h2>
          <ol class="choice-list choice-booths"></ol>
        </section>
        <section>
          <h2 class="choice-group">Home factory</h2>
          <ol class="choice-list choice-factories"></ol>
        </section>
      </div>
    </div>
  </details>`;

const votes = (n: number) => `${n} ${n === 1 ? 'vote' : 'votes'}`;

/** The one line the folded list shows: the booths with a trophy, and the home factory leader. */
export function topLine(choice: PeoplesChoice): string {
  const top = leaders(choice);
  const booths = top.booths.map((entry) => `@${entry.login}`).join(', ');
  const factory = top.factories.map((entry) => `@${entry.login}`).join(', ');
  const parts = [booths && `🏆 ${booths}`, factory && `Home factory: ${factory}`].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'No votes yet';
}

/** When voting closes, or closed, in words. */
export const closingLine = (now: Date, closes = VOTING_CLOSES) =>
  votingClosed(now, closes)
    ? `Voting closed on ${day(closes)}.`
    : `Vote with a 👍 on an entry's comment, one per GitHub account. Voting closes on ${day(closes)}.`;

/** Fills a list with its standings, each entry's place, login and votes set as text. */
function fill(list: HTMLElement, entries: ChoiceEntry[], href: (entry: ChoiceEntry) => string) {
  const at = places(entries);
  list.replaceChildren();
  for (const entry of entries) {
    const item = document.createElement('li');
    const place = document.createElement('span');
    place.className = 'choice-place';
    place.textContent = at.has(entry.login) ? `${at.get(entry.login)}.` : '';
    const link = document.createElement('a');
    link.href = href(entry);
    link.textContent = `@${entry.login}`;
    if (entry.repo) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
    const count = document.createElement('span');
    count.className = 'choice-votes';
    count.textContent = votes(entry.votes);
    item.append(place, ' ', link, ' ', count);
    list.append(item);
  }
  if (!entries.length) {
    const item = document.createElement('li');
    item.textContent = 'No entries yet.';
    list.append(item);
  }
}

/**
 * The People's Choice list below the map: the top three booths and the home
 * factory leader on one line, unfolding to every entry's votes, with a link to
 * vote on the ballot issue. Hidden when the build has no standings.
 */
export function renderChoice(panel: HTMLDetailsElement, choice: PeoplesChoice | undefined) {
  if (!choice) return;
  const $ = <T extends Element>(selector: string) => panel.querySelector<T>(selector)!;
  $('.choice-top').textContent = topLine(choice);
  $('.choice-when').textContent = closingLine(new Date());
  $<HTMLAnchorElement>('.choice-ballot').href = choice.ballot;
  fill(
    $('.choice-booths'),
    choice.booths,
    (entry) => `#/?booth=${encodeURIComponent(entry.login)}`,
  );
  fill($('.choice-factories'), choice.factories, (entry) =>
    entry.repo ? factoryUrl({ login: entry.login, repo: entry.repo }) : entry.url,
  );
  panel.hidden = false;
}
