/**
 * Where focus goes when a panel over the map closes while it held focus: back
 * to what had it before the panel opened, or else the map's canvas, so a
 * keyboard user is never dropped on the page's body. A square's panel, the
 * factory's numbers and the advent calendar all close this way.
 */
export function focusBack(before: HTMLElement | null, frame: ParentNode) {
  const back =
    before && before !== document.body && before.isConnected
      ? before
      : frame.querySelector<HTMLElement>('canvas');
  back?.focus({ preventScroll: true });
}
