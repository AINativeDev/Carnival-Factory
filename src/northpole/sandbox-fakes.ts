/**
 * Fake frames for the sandbox's tests, which run in happy-dom: a page that
 * never loads square.html, so each test plays the frame's side itself. A
 * square's frame gets a stand-in window that records the map's draw requests,
 * and messages reach the map the way a real frame's would, from that window.
 */
import { vi } from 'vitest';

/** Stands in for an ImageBitmap, which happy-dom can't make from a frame. */
export class FakeBitmap {
  readonly close = vi.fn();
  constructor(
    readonly width: number,
    readonly height: number,
  ) {}
}

/** A bitmap `size` pixels a side, as a frame sends one. */
export const bitmap = (size: number) => new FakeBitmap(size, size) as unknown as ImageBitmap;

/** A canvas context that records what the stand-in square paints on it. */
export function fakeContext() {
  const ctx = {
    fillStyle: '',
    font: '',
    textAlign: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
  };
  return { ctx, canvas: ctx as unknown as CanvasRenderingContext2D };
}

/** The words the stand-in last wrote on the context, such as "Opening…". */
export const lastWords = (ctx: ReturnType<typeof fakeContext>['ctx']) =>
  ctx.fillText.mock.lastCall?.[0] as string | undefined;

/** The running frame for the square at `address`, or undefined when none runs. */
export const frameOf = (address: string) =>
  document.querySelector<HTMLIFrameElement>(`iframe[data-id="${address}"]`) ?? undefined;

/**
 * Gives the running frame for `address` a stand-in window, and returns what
 * a test needs to play that frame: what the map asked it, and a way to answer.
 */
export function playFrame(address: string) {
  const iframe = frameOf(address);
  if (!iframe) throw new Error(`No frame runs ${address}`);
  const contentWindow = { postMessage: vi.fn() };
  Object.defineProperty(iframe, 'contentWindow', { value: contentWindow });
  return {
    iframe,
    requests: contentWindow.postMessage,
    send: (data: unknown, source: unknown = contentWindow) => {
      window.dispatchEvent(new MessageEvent('message', { data, source: source as Window }));
    },
  };
}
