/**
 * The intro a first-time visitor sees on the map (docs/specs/intro.md): what
 * the North Pole is, and how a booth gets built, in three beats over a small
 * diorama, shown once and easy to skip. The banner's "What is this?" opens it
 * again at any time.
 */
import { INTRO_EVENT, type IntroClose } from './analytics-events';
import { BOOTH_REQUEST_URL } from './northpole/links';
import { drawBeat, INTRO_BEATS, STILL } from './intro-scene';

/** Where this browser remembers that the intro was closed. */
export const INTRO_SEEN_KEY = 'north-pole-intro-seen';

/** Pixels each beat's scene is drawn at, before CSS fits it to the dialog. */
const SCENE_SIZE = 240;

/**
 * Whether the intro opens as the page loads: only on the map itself, never on
 * a shared or deep link, whose visitor came for something specific, and only
 * until it has been closed once on this browser.
 */
export function showsOnArrival(hash: string, seen: boolean): boolean {
  return !seen && (hash === '' || hash === '#' || hash === '#/');
}

/** Whether the intro was closed before here, or false when the page's storage is off. */
function readSeen() {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // No storage: the intro just shows again next time.
  }
}

/** Tells analytics (src/analytics.ts) the intro opened, or how it closed. */
const tell = (detail: 'opened' | IntroClose) => {
  window.dispatchEvent(new CustomEvent(INTRO_EVENT, { detail }));
};

export interface Intro {
  readonly isOpen: boolean;
  open(): void;
  close(how: IntroClose): void;
  /** Closes it without a word, and stops listening to the banner. */
  stop(): void;
}

/** A new element of the dialog, with its class and perhaps its words, set as text. */
function make<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = '') {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

/** One beat: its scene, which only decorates, then its title and line. */
function beat({ title, line }: { title: string; line: string }) {
  const canvas = make('canvas', 'intro-scene');
  canvas.width = canvas.height = SCENE_SIZE;
  canvas.setAttribute('aria-hidden', 'true');
  const words = make('p', 'intro-line', ` ${line}`);
  words.prepend(make('strong', '', title));
  const item = make('li', 'intro-beat');
  item.append(canvas, words);
  return { item, ctx: canvas.getContext('2d') };
}

/** The dialog over its backdrop: Skip, the title, the three beats and the two ways on. */
function buildDialog() {
  const backdrop = make('div', 'intro-backdrop');
  const dialog = make('section', 'intro');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'intro-title');
  const skip = make('button', 'intro-skip', 'Skip');
  const title = make('h2', 'intro-title', 'Welcome to the North Pole Carnival');
  title.id = 'intro-title';
  const lead = make('p', 'intro-lead', 'Every stall here was asked for by someone. Here is how.');
  const beats = INTRO_BEATS.map(beat);
  const list = make('ol', 'intro-beats');
  list.append(...beats.map(({ item }) => item));
  const explore = make('button', 'intro-explore', 'Explore the North Pole');
  const build = make('a', 'intro-build', 'Build your own booth');
  Object.assign(build, { href: BOOTH_REQUEST_URL, target: '_blank', rel: 'noopener' });
  const actions = make('div', 'intro-actions');
  actions.append(explore, build);
  dialog.append(skip, title, lead, list, actions);
  backdrop.append(dialog);
  return { backdrop, dialog, skip, explore, build, scenes: beats.map(({ ctx }) => ctx) };
}

/**
 * Opens the intro now if `hash` is a first visit to the map, and wires the
 * banner's "What is this?" to open it again.
 */
export function startIntro(hash: string): Intro {
  let backdrop: HTMLElement | undefined;
  let returnTo: Element | null = null;
  let frame = 0;

  const open = () => {
    if (backdrop) return;
    returnTo = document.activeElement;
    const parts = buildDialog();
    backdrop = parts.backdrop;
    document.body.append(backdrop);
    animate(parts.scenes);
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) close('skip');
    });
    const ways: [HTMLElement, IntroClose][] = [
      [parts.skip, 'skip'],
      [parts.explore, 'explore'],
      [parts.build, 'build'],
    ];
    for (const [way, how] of ways)
      way.addEventListener('click', () => {
        close(how);
      });
    parts.dialog.addEventListener('keydown', (event) => {
      onKey(parts.dialog, event);
    });
    parts.explore.focus();
    tell('opened');
  };

  /** Draws each beat's scene: still with reduced motion, else every frame while open. */
  const animate = (scenes: (CanvasRenderingContext2D | null)[]) => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint = (now: number) => {
      scenes.forEach((ctx, beat) => {
        if (ctx) drawBeat(ctx, beat, SCENE_SIZE, still ? STILL : now / 1000);
      });
      if (!still) frame = requestAnimationFrame(paint);
    };
    paint(0);
  };

  /** Esc closes; Tab and Shift+Tab go round the dialog; and the map behind never hears a key. */
  const onKey = (dialog: HTMLElement, event: KeyboardEvent) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      close('skip');
      return;
    }
    if (event.key !== 'Tab') return;
    const stops = [...dialog.querySelectorAll<HTMLElement>('button, a[href]')];
    const first = stops[0];
    const last = stops[stops.length - 1];
    const wrapTo = event.shiftKey
      ? document.activeElement === first && last
      : document.activeElement === last && first;
    if (!wrapTo) return;
    event.preventDefault();
    wrapTo.focus();
  };

  const dismiss = () => {
    cancelAnimationFrame(frame);
    backdrop?.remove();
    backdrop = undefined;
  };

  const close = (how: IntroClose) => {
    if (!backdrop) return;
    dismiss();
    markSeen();
    tell(how);
    // Focus goes back where it was, or to the map when that has gone.
    const back =
      returnTo instanceof HTMLElement && returnTo.isConnected && returnTo !== document.body
        ? returnTo
        : document.querySelector<HTMLElement>('.map-canvas');
    back?.focus({ preventScroll: true });
  };

  const reopen = document.querySelector('.intro-open');
  reopen?.addEventListener('click', open);
  if (showsOnArrival(hash, readSeen())) open();

  return {
    get isOpen() {
      return backdrop !== undefined;
    },
    open,
    close,
    stop: () => {
      dismiss();
      reopen?.removeEventListener('click', open);
    },
  };
}
