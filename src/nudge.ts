/**
 * The one nudge to build your own: a small line over the map, just after a
 * visitor has enjoyed something, that points to the free spot nearest them
 * (ADR 0065). It shows at most once a page load, never in the first minute,
 * never once closed, and never for someone who said which booth is theirs, so
 * it's a well-timed invitation rather than one more banner.
 */

/** When the nudge may come: a minute after the page opened, after 20 s inside one square, or a third square visited. */
export const NUDGE = { settle: 60_000, inside: 20_000, visits: 3, shown: 15_000, delay: 800 };

/** Where the page remembers that the visitor closed the nudge for good: its own storage, never a square's. */
const CLOSED_KEY = 'north-pole-nudge-closed';

/** What the nudge weighs when the player comes out of a square. */
export interface NudgeMoment {
  /** How long since the page opened, in ms. */
  sinceLoad: number;
  /** How long the player was inside the square they just left, in ms. */
  inside: number;
  /** How many different squares they've been inside. */
  visits: number;
}

/** Whether this is the moment: settled in, and either lingered in a square or looked round a few. */
export const nudgeDue = ({ sinceLoad, inside, visits }: NudgeMoment) =>
  sinceLoad >= NUDGE.settle && (inside >= NUDGE.inside || visits >= NUDGE.visits);

/** Whether the visitor closed the nudge for good; a page without storage never remembers. */
function closedForGood(): boolean {
  try {
    return localStorage.getItem(CLOSED_KEY) === '1';
  } catch {
    return false;
  }
}

function closeForGood() {
  try {
    localStorage.setItem(CLOSED_KEY, '1');
  } catch {
    // No storage: it only stays closed for this page load.
  }
}

/** The nudge's line, its way to the free spot, and the way to close it. */
function nudgeCard(onGo: () => void, onClose: () => void): HTMLElement {
  const card = document.createElement('aside');
  card.className = 'nudge';
  card.setAttribute('role', 'status');
  const line = document.createElement('p');
  line.textContent = 'Liked that one? There’s a free spot nearby for a booth of your own.';
  const go = document.createElement('button');
  go.type = 'button';
  go.className = 'nudge-go';
  go.textContent = 'Show me →';
  go.addEventListener('click', onGo);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nudge-close';
  close.setAttribute('aria-label', 'Not now');
  close.textContent = '×';
  close.addEventListener('click', onClose);
  card.append(line, go, close);
  return card;
}

/** What the page tells the nudge, and how it acts. */
export interface NudgeOptions {
  /** Walks the player to the nearest free spot and bounces its sign. */
  showSpot: () => void;
  /** Whether the visitor said which booth is theirs. */
  mine: () => boolean;
}

/** Follows the visitor's squares on the map in `frame`, and nudges once, at the right moment. */
export function startNudge(frame: HTMLElement, options: NudgeOptions) {
  const loadedAt = performance.now();
  const visited = new Set<string>();
  let enteredAt: number | undefined;
  let shown = false;
  let card: HTMLElement | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const hide = () => {
    clearTimeout(timer);
    timer = undefined;
    card?.remove();
    card = undefined;
  };
  const show = () => {
    shown = true;
    card = nudgeCard(
      () => {
        hide();
        options.showSpot();
      },
      () => {
        hide();
        closeForGood();
      },
    );
    frame.append(card);
    timer = setTimeout(hide, NUDGE.shown);
  };
  return {
    /** The player went inside square `id`: a nudge waiting to show never does. */
    entered(id: string) {
      hide();
      visited.add(id);
      enteredAt = performance.now();
    },
    /** The player came out: the nudge shows a moment later, once the fade is done, if it's due. */
    left() {
      const now = performance.now();
      const inside = enteredAt === undefined ? 0 : now - enteredAt;
      enteredAt = undefined;
      if (shown || card || timer || closedForGood() || options.mine()) return;
      if (!nudgeDue({ sinceLoad: now - loadedAt, inside, visits: visited.size })) return;
      timer = setTimeout(() => {
        timer = undefined;
        show();
      }, NUDGE.delay);
    },
    /** The visitor is already on the way to a spot of their own: no nudge this page load. */
    skip() {
      hide();
      shown = true;
    },
    stop: hide,
  };
}

/** The nudge on the map now. */
export type Nudge = ReturnType<typeof startNudge>;
