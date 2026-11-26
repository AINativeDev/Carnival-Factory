/**
 * On a phone, a square's panel is a sheet under the booth with a handle at
 * its top: drag it up to read the whole story, down to keep the booth big.
 * It snaps to a few heights when let go, and the arrow keys step through them.
 * On a laptop the handle stays hidden (style.css) and nothing changes.
 */

/** The heights the sheet rests at, as parts of its frame's height: small, half, nearly all. */
/** The tallest the sheet goes: the booth's corner tools stay in sight above it. */
const MOST_OF_THE_SCREEN = 0.85;
export const SHEET_STOPS = [0.25, 0.5, MOST_OF_THE_SCREEN] as const;

/** The stop nearest `height` in a frame `frame` tall. */
export function nearestStop(height: number, frame: number): number {
  const parts = SHEET_STOPS.map((part) => part * frame);
  return parts.reduce((best, part) =>
    Math.abs(part - height) < Math.abs(best - height) ? part : best,
  );
}

/** Adds the handle to `panel`, the visit's card, and makes it resize the sheet; `stop` removes it. */
export function visitSheet(panel: HTMLElement) {
  const handle = document.createElement('div');
  handle.className = 'visit-sheet-handle';
  handle.tabIndex = 0;
  handle.setAttribute('role', 'separator');
  handle.setAttribute('aria-orientation', 'horizontal');
  handle.setAttribute('aria-label', 'Resize the panel');
  panel.prepend(handle);
  const frameHeight = () => panel.parentElement?.clientHeight ?? 0;
  const setHeight = (height: number) => {
    const most = MOST_OF_THE_SCREEN * frameHeight();
    panel.style.height = `${String(Math.round(Math.min(Math.max(height, 60), most)))}px`;
  };
  let from: { y: number; height: number } | undefined;
  const onDown = (event: PointerEvent) => {
    from = { y: event.clientY, height: panel.offsetHeight };
    // Keep the drag even when the finger slides off the handle.
    handle.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent) => {
    if (from) setHeight(from.height + from.y - event.clientY);
  };
  const onUp = () => {
    if (!from) return;
    from = undefined;
    setHeight(nearestStop(panel.offsetHeight, frameHeight()));
  };
  const onKey = (event: KeyboardEvent) => {
    const step = { ArrowUp: 1, ArrowDown: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const heights = SHEET_STOPS.map((part) => part * frameHeight());
    const now = nearestStop(panel.offsetHeight, frameHeight());
    // The next stop up or down; at either end it stays where it is.
    const next = step > 0 ? heights.find((h) => h > now) : heights.reverse().find((h) => h < now);
    setHeight(next ?? now);
  };
  handle.addEventListener('pointerdown', onDown);
  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onUp);
  handle.addEventListener('pointercancel', onUp);
  handle.addEventListener('keydown', onKey);
  return {
    stop() {
      handle.remove();
      panel.style.removeProperty('height');
    },
  };
}
