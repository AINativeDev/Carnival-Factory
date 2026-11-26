/**
 * On a wide screen the drawing stands in the middle (`centredBox` in
 * src/northpole/visit-stage.ts), with a column either side: the square's
 * name, maker and description on the left, its panel on the right, both as
 * wide as the space beside the drawing. On a narrower screen the name and
 * description stay at the top of the panel. The map writes where the drawing
 * stands to the canvas (`data-stage`, in device pixels); this follows it.
 */
import { COLUMN } from './northpole/visit-stage';

/** The canvas's pixels per CSS pixel, as the map sets them (map-layers.ts). */
const scaleOf = () => Math.min(2, window.devicePixelRatio || 1);

/** How wide the columns either side of a drawing at `stage` are, or undefined when they're too narrow. */
export function columnWidth(stage: string | undefined, scale: number): number | undefined {
  const [x = 0, , w = 0] = (stage ?? '').split(',').map(Number);
  const column = x / scale;
  // A pixel short of `COLUMN` is rounding, not a narrow screen.
  return w > 0 && column >= COLUMN - 1 ? column : undefined;
}

/** Moves `intro` left of the drawing while there's room, and back into `panel` when there isn't. */
export function visitColumns(frame: HTMLElement, panel: HTMLElement, intro: HTMLElement) {
  const left = document.createElement('section');
  left.className = 'visit-left';
  left.setAttribute('aria-label', 'About this square');
  const home = intro.nextElementSibling;
  const canvas = frame.querySelector('canvas');
  const place = () => {
    // A browser drops the focus from what moves: whatever in it had the focus keeps it.
    const focused = intro.contains(document.activeElement) ? document.activeElement : null;
    const column = columnWidth(canvas?.dataset.stage, scaleOf());
    if (column === undefined) {
      delete frame.dataset.columns;
      left.remove();
      panel.insertBefore(intro, home);
    } else {
      frame.dataset.columns = '';
      frame.style.setProperty('--visit-column', `${String(column)}px`);
      left.append(intro);
      if (!left.isConnected) frame.append(left);
    }
    if (focused instanceof HTMLElement && focused !== document.activeElement)
      focused.focus({ preventScroll: true });
  };
  const watch = new MutationObserver(place);
  if (canvas) watch.observe(canvas, { attributes: true, attributeFilter: ['data-stage'] });
  place();
  return {
    stop() {
      watch.disconnect();
      left.remove();
      delete frame.dataset.columns;
      frame.style.removeProperty('--visit-column');
    },
  };
}
