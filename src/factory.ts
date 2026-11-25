import { HOW_IT_WORKS_URL, OWN_REPO_URL } from './northpole/links';
import { factoryFigures, factoryNote, type SquareCounts } from './factory-figures';
import type { FactoryStats } from '../scripts/factory-stats';
import { SIGNUP_OFFER, showSignupOffer } from './offer';
import type { VisitHud } from './visit-hud';

/**
 * The factory's numbers page, `#/factory`: how many booths and attractions
 * the map has, counted from the squares in this build, and how much the
 * factory has built, from the numbers the deploy read
 * (scripts/factory-stats.ts). A build without them, such as a preview or
 * `npm run dev`, shows the counts it has and says the rest appear on the
 * live map.
 */

export interface FactoryHudOptions {
  squares: SquareCounts;
  stats?: FactoryStats | undefined;
  /** Leaves the page: Esc, or the Leave button. */
  onClose(): void;
}

/**
 * The numbers page over the map, in a visit's cream panel with its gold
 * border. Every number is set as text. Focus moves into it, and back out
 * when it closes.
 */
export function openFactoryHud(frame: HTMLElement, options: FactoryHudOptions): VisitHud {
  const before = document.activeElement as HTMLElement | null;
  const card = document.createElement('section');
  card.className = 'hud factory';
  card.setAttribute('aria-labelledby', 'factory-title');
  card.innerHTML = `
    <p class="visit-leave"><span>Esc to go back to the map</span> <button class="visit-close" type="button">Leave</button></p>
    <h2 id="factory-title" class="visit-title" tabindex="-1">The North Pole Carnival factory</h2>
    <p class="factory-intro">Every booth here began as an issue. A software factory built it, checked it and put it on the map.</p>
    <ul class="factory-figures"></ul>
    <p class="factory-note"></p>
    <p class="factory-how"><a href="${HOW_IT_WORKS_URL}" target="_blank" rel="noopener">How it works</a> <span aria-hidden="true">·</span> <a href="${OWN_REPO_URL}" target="_blank" rel="noopener">Run this on your own repo</a> <span aria-hidden="true">·</span> <a href="#/advent">The advent calendar</a></p>
    ${SIGNUP_OFFER}`;
  const $ = <T extends Element>(selector: string) => card.querySelector<T>(selector)!;

  for (const figure of factoryFigures(options.squares, options.stats)) {
    const item = document.createElement('li');
    item.className = 'factory-figure';
    const value = document.createElement('span');
    value.className = 'factory-value';
    value.textContent = figure.value;
    const label = document.createElement('span');
    label.className = 'factory-label';
    label.textContent = figure.label;
    item.append(value, ' ', label);
    if (figure.detail) {
      const detail = document.createElement('span');
      detail.className = 'factory-detail';
      detail.textContent = figure.detail;
      item.append(' ', detail);
    }
    $('.factory-figures').append(item);
  }
  $('.factory-note').textContent = factoryNote(options.stats);
  showSignupOffer(card);

  $('.visit-close').addEventListener('click', () => options.onClose());
  // The page has every key: the map behind it never walks, enters a square or opens its search.
  const onKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      options.onClose();
    }
  };
  document.addEventListener('keydown', onKeyDown);

  frame.dataset.factory = '';
  frame.append(card);
  $<HTMLElement>('.visit-title').focus({ preventScroll: true });

  return {
    close() {
      document.removeEventListener('keydown', onKeyDown);
      delete frame.dataset.factory;
      const hadFocus = card.contains(document.activeElement);
      card.remove();
      if (hadFocus) {
        const back =
          before && before !== document.body && before.isConnected
            ? before
            : frame.querySelector<HTMLElement>('canvas');
        back?.focus({ preventScroll: true });
      }
    },
  };
}
