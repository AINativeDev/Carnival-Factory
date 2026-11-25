/**
 * The frame element the map makes for a square, and what the stand-in paints
 * while there's no picture from it. The frame's `sandbox` attribute and its
 * page, square.html with its content security policy, are the sandbox itself
 * (docs/adr/0004-sandbox-every-square.md): loosen nothing here.
 */
import { BUILD_ID } from '../updates';
import type { SquareKind } from './frame-protocol';
import type { FrameState } from './sandbox-run';
import type { ThemeColor } from './square';
import { canvasFont, theme } from './theme';

let holder: HTMLElement | undefined;

/** Where the frames live: off screen, out of the way of clicks and screen readers. */
function frameHolder(): HTMLElement {
  if (!holder) {
    holder = document.createElement('div');
    holder.setAttribute('aria-hidden', 'true');
    Object.assign(holder.style, {
      position: 'fixed',
      left: '-10px',
      top: '-10px',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      opacity: '0',
      pointerEvents: 'none',
    });
    document.body.append(holder);
  }
  return holder;
}

/** Opens the sandboxed frame that runs the square at `address`, in the frames' holder. */
export function openFrame(kind: SquareKind, address: string, state: FrameState) {
  const iframe = document.createElement('iframe');
  iframe.sandbox.add('allow-scripts');
  iframe.referrerPolicy = 'no-referrer';
  iframe.tabIndex = -1;
  iframe.title = `${kind} ${address}`;
  iframe.dataset.kind = kind;
  iframe.dataset.id = address;
  iframe.dataset.state = state;
  // The frame page of this page's own build, so a cached page and its frames
  // always come from the same build, even while caches catch up.
  iframe.src = new URL(`square.html?v=${BUILD_ID}#${kind}/${address}`, document.baseURI).href;
  frameHolder().append(iframe);
  return iframe;
}

/** Fills the square with `background` and writes `words` across its middle. */
export function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  size: number,
  background: ThemeColor,
  words: string,
) {
  ctx.fillStyle = theme.colors[background];
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = theme.colors.muted;
  ctx.font = canvasFont('small');
  ctx.textAlign = 'center';
  ctx.fillText(words, size / 2, size / 2, size);
}
