/**
 * Runs one booth or attraction on a thread of its own, inside its sandboxed
 * frame. The frame watches it and stops it if it hangs, so a square stuck in
 * a loop can't freeze any other square. It has no DOM at all: it draws onto an
 * OffscreenCanvas and sends each frame to the frame as a bitmap.
 */
import { readDrawRequest, readFrameAddress, readStall } from './frame-protocol';
import type { NorthPoleSquare } from './square';

type Loader = () => Promise<NorthPoleSquare | undefined>;

// Not eager: each square is its own chunk, loaded only by its own worker.
const booths = import.meta.glob<NorthPoleSquare | undefined>('../../carnival/booths/*/booth.ts', {
  import: 'default',
});
const attractions = import.meta.glob<NorthPoleSquare | undefined>(
  '../../carnival/attractions/*/attraction.ts',
  { import: 'default' },
);
const levelSquares = import.meta.glob<NorthPoleSquare | undefined>(
  '../../carnival/levels/*/squares/*/square.ts',
  { import: 'default' },
);

// A worker's postMessage, which the DOM types don't describe.
const send = (message: object, transfer: Transferable[] = []) =>
  (postMessage as (message: unknown, transfer: Transferable[]) => void)(message, transfer);

async function load(hash: string): Promise<NorthPoleSquare> {
  const address = readFrameAddress(hash);
  if (!address) throw new Error(`Not a square: ${hash}`);
  const loader: Loader | undefined =
    address.kind === 'booth'
      ? booths[`../../carnival/booths/${address.id}/booth.ts`]
      : address.kind === 'level'
        ? levelSquares[`../../carnival/levels/${address.level}/squares/${address.id}/square.ts`]
        : attractions[`../../carnival/attractions/${address.id}/attraction.ts`];
  if (!loader) throw new Error(`No ${address.kind} called ${address.id}`);
  const square = await loader();
  if (!square || square.id !== address.id || typeof square.draw !== 'function') {
    throw new Error(`The ${address.kind} ${address.id} doesn't export its NorthPoleSquare`);
  }
  return square;
}

let square: NorthPoleSquare | undefined;
let canvas: OffscreenCanvas | undefined;

addEventListener('message', (event: MessageEvent) => {
  const data = event.data as { type?: unknown; hash?: unknown };
  if (data?.type === 'load' && typeof data.hash === 'string' && !square) {
    load(data.hash).then(
      (loaded) => {
        square = loaded;
        // Only the checked fields, so nothing the square hangs on its option is sent.
        const stall = readStall(loaded.stall);
        send({ type: 'ready', name: loaded.name, description: loaded.description, stall });
      },
      (error) => send({ type: 'error', message: String(error) }),
    );
    return;
  }
  const request = readDrawRequest(event.data);
  if (!request || !square) return;
  const { size, time, pointer } = request;
  // A fresh size resets the canvas: its pixels, transform, clip and styles.
  if (!canvas || canvas.width !== size) canvas = new OffscreenCanvas(size, size);
  else canvas.width = size;
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  const start = performance.now();
  try {
    square.draw(ctx, size, time, pointer);
  } catch (error) {
    send({ type: 'error', message: String(error) });
    return;
  }
  const drawMs = performance.now() - start;
  const bitmap = canvas.transferToImageBitmap();
  send({ type: 'frame', bitmap, drawMs }, [bitmap]);
});

// The worker's script has arrived and run: the frame starts timing from here.
send({ type: 'started' });
