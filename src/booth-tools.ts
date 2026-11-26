/**
 * The booth's own tools, for now Full screen, on the top-right corner of the
 * square's drawing, so they sit on the thing they act on wherever the room
 * puts it, full screen too. The room writes where the drawing is to the
 * canvas (`data-stage`, in device pixels); this follows it.
 */

/** The canvas's pixels per CSS pixel, as the map sets them (map-layers.ts). */
const scaleOf = () => Math.min(2, window.devicePixelRatio || 1);

/** The space between the drawing's edge and the tools, in CSS pixels. */
const INSET = 10;

/** The tools' width: one round button, as the stylesheet draws it. */
const WIDTH = 40;

/** Where the tools stand for a drawing at `stage` (device pixels `x,y,w,h`), or nothing without one. */
function toolsAt(stage: string | undefined, scale: number, width = WIDTH) {
  const [x = 0, y = 0, w = 0] = (stage ?? '').split(',').map(Number);
  if (!(w > 0)) return undefined;
  return { left: (x + w) / scale - width - INSET, top: y / scale + INSET };
}

/** Adds the tools' stack to the map's frame and keeps it on the drawing's corner; `stop` removes it. */
export function boothTools(frame: HTMLElement) {
  const tools = document.createElement('div');
  tools.className = 'booth-tools';
  frame.append(tools);
  const canvas = frame.querySelector('canvas');
  const place = () => {
    const at = toolsAt(canvas?.dataset.stage, scaleOf());
    tools.hidden = !at;
    if (at) {
      tools.style.left = `${String(at.left)}px`;
      tools.style.top = `${String(at.top)}px`;
    }
  };
  const watch = new MutationObserver(place);
  if (canvas) watch.observe(canvas, { attributes: true, attributeFilter: ['data-stage'] });
  place();
  return {
    element: tools,
    stop() {
      watch.disconnect();
      tools.remove();
    },
  };
}
