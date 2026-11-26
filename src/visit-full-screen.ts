/**
 * The Full screen button on a booth's corner: the booth's drawing as big as
 * the space beside the panel allows, with no room round it
 * (src/northpole/full-screen.ts draws it). The panel stays where it is. Esc, or
 * the button again, comes back to the room, not out of the booth. Booths need
 * no change: each draws to whatever size it's given.
 */

/** The full-screen icon people know: four corners pointing out (Lucide's "maximize"). */
const FULL_ICON =
  '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';

/** Adds the Full screen button to `parent` for a visit; `stop` goes back to the room and removes it. */
export function fullScreenPill(frame: HTMLElement, parent: HTMLElement = frame) {
  const pill = document.createElement('button');
  pill.type = 'button';
  pill.className = 'visit-full';
  pill.title = 'Full screen';
  pill.innerHTML = `${FULL_ICON}<span class="visit-full-label">Full screen</span>`;
  const label = pill.querySelector('.visit-full-label') as HTMLElement;
  const on = () => frame.dataset.full !== undefined;
  const enter = () => {
    frame.dataset.full = '';
    label.textContent = pill.title = 'Back to the room';
  };
  const leave = () => {
    if (!on()) return;
    delete frame.dataset.full;
    label.textContent = pill.title = 'Full screen';
  };
  pill.addEventListener('click', () => {
    if (on()) leave();
    else enter();
  });
  // Esc goes back to the room first: caught before the visit's own Esc, which leaves the booth.
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !on()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    leave();
  };
  document.addEventListener('keydown', onKey, true);
  parent.append(pill);
  return {
    pill,
    stop() {
      leave();
      document.removeEventListener('keydown', onKey, true);
      pill.remove();
    },
  };
}
