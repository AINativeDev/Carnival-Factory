/**
 * The Full screen button over a square's top-right corner: its drawing as big
 * as the whole screen allows, with nothing else on it (`fullBox` in
 * src/northpole/visit-stage.ts), in the browser's own full screen where it has
 * one, and the page filled where it hasn't, as on an iPhone. Esc, or the
 * button again, comes back to the square beside its panel, not out of it.
 * Booths need no change: each draws to whatever size it's given.
 */

/** The full-screen icon people know: four corners pointing out (Lucide's "maximize"). */
const FULL_ICON =
  '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';

/** Adds the Full screen button to `parent` for a visit; `stop` ends full screen and removes it. */
export function fullScreenPill(frame: HTMLElement, parent: HTMLElement = frame) {
  const pill = document.createElement('button');
  pill.type = 'button';
  pill.className = 'visit-full';
  pill.title = 'Full screen';
  pill.innerHTML = `${FULL_ICON}<span class="visit-full-label">Full screen</span>`;
  const label = pill.querySelector('.visit-full-label') as HTMLElement;
  const on = () => frame.dataset.full !== undefined;
  // The map's canvas fits its frame again on a resize, and the frame changes size.
  const refit = () => window.dispatchEvent(new Event('resize'));
  const enter = () => {
    frame.dataset.full = '';
    label.textContent = pill.title = 'Exit full screen';
    // Not every browser has it (Safari on an iPhone, for a page's element), and it
    // can refuse: the page is filled either way.
    if ('requestFullscreen' in frame && typeof frame.requestFullscreen === 'function')
      frame.requestFullscreen().catch(() => undefined);
    refit();
  };
  const leave = () => {
    if (!on()) return;
    delete frame.dataset.full;
    label.textContent = pill.title = 'Full screen';
    if (document.fullscreenElement === frame) document.exitFullscreen().catch(() => undefined);
    refit();
  };
  pill.addEventListener('click', () => {
    if (on()) leave();
    else enter();
  });
  // Esc leaves full screen first: caught before the visit's own Esc, which leaves the square.
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !on()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    leave();
  };
  // The browser's own Esc, or its own way out, ends its full screen: follow it back.
  const onChange = () => {
    if (!document.fullscreenElement) leave();
  };
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('fullscreenchange', onChange);
  parent.append(pill);
  return {
    pill,
    stop() {
      leave();
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('fullscreenchange', onChange);
      pill.remove();
    },
  };
}
