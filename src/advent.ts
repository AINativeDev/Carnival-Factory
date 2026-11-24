import calendarData from '../challenges/advent.json';
import {
  cleanCalendar,
  isDoorOpen,
  type AdventCalendar,
  type AdventChallenge,
} from '../northpole/advent';
import { ADVENT_REQUEST_URL, OWN_REPO_URL } from '../northpole/links';
import { SIGNUP_OFFER, showSignupOffer } from './offer';
import type { VisitHud } from './visit-hud';

/**
 * The advent calendar, `#/advent`: 24 small challenges to do with a Tessl
 * factory on your own repository, one a day from 1 to 24 December, from
 * challenges/advent.json, baked into the page. Each door opens at midnight on
 * its day, by the visitor's own clock. Marking one done is an issue form, and
 * nothing here is tracked or sent anywhere.
 */
export const ADVENT_CALENDAR: AdventCalendar = cleanCalendar(calendarData);

/** One door of the calendar: its challenge, shown once it opens. */
export type AdventDoor =
  { day: number; open: true; challenge: AdventChallenge } | { day: number; open: false };

/** The calendar's doors at `now`, every day in order, each open or shut. */
export function adventDoors(calendar: AdventCalendar, now: Date): AdventDoor[] {
  return calendar.challenges.map((challenge) =>
    isDoorOpen(challenge.day, now, calendar.year)
      ? { day: challenge.day, open: true, challenge }
      : { day: challenge.day, open: false },
  );
}

/** The line under the title: how many doors are open, or when the first one opens. */
export function adventNote(doors: readonly AdventDoor[], year: number): string {
  const open = doors.filter((door) => door.open).length;
  if (open === 0) return `The first door opens on 1 December ${year}.`;
  if (open === doors.length) return `All ${doors.length} doors are open.`;
  return `${open} of ${doors.length} doors are open. The next one opens tomorrow.`;
}

export interface AdventHudOptions {
  /** The time the doors are read at. */
  now: Date;
  /** Leaves the page: Esc, or the Leave button. */
  onClose(): void;
}

/**
 * The calendar over the map, in the factory page's panel. Every challenge is
 * set as text. Focus moves into it, and back out when it closes.
 */
export function openAdventHud(frame: HTMLElement, options: AdventHudOptions): VisitHud {
  const before = document.activeElement as HTMLElement | null;
  const card = document.createElement('section');
  card.className = 'hud factory advent';
  card.setAttribute('aria-labelledby', 'advent-title');
  card.innerHTML = `
    <p class="visit-leave"><span>Esc to go back to the map</span> <button class="visit-close" type="button">Leave</button></p>
    <h2 id="advent-title" class="visit-title" tabindex="-1">The advent calendar</h2>
    <p class="factory-intro">A small challenge a day, each about 15 minutes with a Tessl factory on a repository of your own. Done one? <a href="${ADVENT_REQUEST_URL}" target="_blank" rel="noopener">Mark it done</a>, and your booth gets a decoration: ornaments, then lights, a star after 12 and a glowing sign after 24.</p>
    <p class="factory-note"></p>
    <ol class="advent-doors"></ol>
    <p class="factory-how">It's opt-in: nothing is tracked, and nobody is pinged. <a href="${OWN_REPO_URL}" target="_blank" rel="noopener">Run this on your own repo</a></p>
    ${SIGNUP_OFFER}`;
  const $ = <T extends Element>(selector: string) => card.querySelector<T>(selector)!;

  // The doors as they are at `now`, and again at each midnight while the calendar stays open.
  let midnight: ReturnType<typeof setTimeout> | undefined;
  const showDoors = (now: Date) => {
    const doors = adventDoors(ADVENT_CALENDAR, now);
    $('.advent-doors').replaceChildren();
    $('.factory-note').textContent = adventNote(doors, ADVENT_CALENDAR.year);
    for (const door of doors) {
      const item = document.createElement('li');
      item.className = 'advent-door';
      const day = document.createElement('span');
      day.className = 'advent-day';
      day.textContent = String(door.day);
      item.append(day);
      if (door.open) {
        item.dataset.open = '';
        const { challenge } = door;
        const title = document.createElement('strong');
        title.className = 'advent-title';
        title.textContent = challenge.title;
        const what = document.createElement('span');
        what.textContent = challenge.do;
        const check = document.createElement('span');
        check.className = 'advent-check';
        check.textContent = `You'll know it worked when: ${challenge.check}`;
        const docs = document.createElement('a');
        docs.href = challenge.docs;
        docs.target = '_blank';
        docs.rel = 'noopener';
        docs.textContent = 'Read the docs';
        item.append(title, what, check, docs);
      } else {
        const shut = document.createElement('span');
        shut.className = 'advent-shut';
        shut.textContent = `Opens on ${door.day} December`;
        item.append(shut);
      }
      $('.advent-doors').append(item);
    }
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    midnight = setTimeout(() => showDoors(new Date()), next.getTime() - now.getTime() + 1000);
  };
  showDoors(options.now);
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
      clearTimeout(midnight);
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
