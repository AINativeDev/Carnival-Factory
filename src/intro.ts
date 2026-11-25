/**
 * The intro a first-time visitor sees on the map (docs/specs/intro.md): what
 * the North Pole is, and how a booth gets built, in three beats over a small
 * diorama, shown once and easy to skip. The top bar's About (src/top-menu.ts) opens it
 * again at any time.
 */
import { INTRO_EVENT, type IntroClose } from './analytics-events';
import { buildDialog, SCENE_SIZE } from './intro-dialog';
import { drawBeat, STILL } from './intro-scene';

/** Where this browser remembers that the intro was closed. */
export const INTRO_SEEN_KEY = 'north-pole-intro-seen';

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

/**
 * Opens the intro now if `hash` is a first visit to the map, and wires the
 * top bar's About to open it again.
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
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) close('skip');
    });
    const ways: [HTMLElement, IntroClose][] = [
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
    // A route change behind it (Back, say) moves focus to the new page, so the intro gives way.
    window.addEventListener('hashchange', onRoute);
    // The map lets go of a walking key on blur (src/northpole/map.ts), so nobody walks behind it.
    window.dispatchEvent(new Event('blur'));
    parts.explore.focus();
    tell('opened');
    // Last, with every way out wired: the scenes only decorate, so one that can't draw stops.
    animate(parts.scenes);
  };

  /** Draws each beat's scene: still with reduced motion, else every frame while open. */
  const animate = (scenes: (CanvasRenderingContext2D | null)[]) => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint = (now: number) => {
      try {
        scenes.forEach((ctx, beat) => {
          if (ctx) drawBeat(ctx, beat, SCENE_SIZE, still ? STILL : now / 1000);
        });
      } catch {
        // A context the browser couldn't give: the scenes stay blank, and the intro works on.
        return;
      }
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

  const onRoute = () => {
    close('skip', false);
  };

  const dismiss = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('hashchange', onRoute);
    backdrop?.remove();
    backdrop = undefined;
  };

  const close = (how: IntroClose, refocus = true) => {
    if (!backdrop) return;
    dismiss();
    markSeen();
    tell(how);
    if (!refocus) return;
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
