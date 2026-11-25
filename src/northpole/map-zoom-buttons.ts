/**
 * The zoom buttons over the map: "+" and "−", for a mouse, a finger or the
 * keyboard, on the North Pole and on every level alike. The map makes them in
 * its own frame, as it makes the tag, so every page that shows a map has them;
 * what they do is map-zoom.ts.
 */

/** The pair of zoom buttons and the group round them. */
export interface ZoomButtons {
  element: HTMLElement;
  nearer: HTMLButtonElement;
  farther: HTMLButtonElement;
}

/** Makes the zoom buttons inside the map's frame, beside the page's own actions over it if it has them. */
export function makeZoomButtons(frame: HTMLElement): ZoomButtons {
  const element = document.createElement('div');
  element.className = 'hud-zoom';
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', 'Zoom');
  const button = (text: string, label: string) => {
    const made = document.createElement('button');
    made.type = 'button';
    made.className = 'hud';
    made.textContent = text;
    made.title = label;
    made.setAttribute('aria-label', label);
    return made;
  };
  const nearer = button('+', 'Zoom in');
  const farther = button('−', 'Zoom out');
  element.append(nearer, farther);
  (frame.querySelector('.hud-actions') ?? frame).append(element);
  return { element, nearer, farther };
}

/** Turns each button off at its limit: in at the nearest the camera comes, out at the whole island. */
export function showZoomLimits(buttons: ZoomButtons, canNear: boolean, canFar: boolean) {
  if (buttons.nearer.disabled === canNear) buttons.nearer.disabled = !canNear;
  if (buttons.farther.disabled === canFar) buttons.farther.disabled = !canFar;
}
