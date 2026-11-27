// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canvasFont, theme } from './theme';

/** A fresh module per test, since it keeps the frames' holder once made. */
async function sandboxFrame() {
  vi.resetModules();
  return import('./sandbox-frame');
}

beforeEach(() => {
  // happy-dom never loads a frame's page, and says so.
  vi.useFakeTimers();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  document.body.innerHTML = '';
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("the frames' holder", () => {
  it('keeps every frame one pixel square, off screen, invisible and out of reach', async () => {
    const { openFrame } = await sandboxFrame();
    const iframe = openFrame('booth', 'elf', 'loading');
    const holder = iframe.parentElement;
    expect(holder?.parentElement).toBe(document.body);
    expect(holder?.tagName).toBe('DIV');
    expect(holder?.getAttribute('aria-hidden')).toBe('true');
    expect(holder?.style).toMatchObject({
      position: 'fixed',
      left: '-10px',
      top: '-10px',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      opacity: '0',
      pointerEvents: 'none',
    });
  });

  it('holds every frame in the one holder', async () => {
    const { openFrame } = await sandboxFrame();
    const first = openFrame('booth', 'elf', 'loading');
    const second = openFrame('attraction', 'ferris-wheel', 'broken');
    expect(second.parentElement).toBe(first.parentElement);
    expect(document.body.children).toHaveLength(1);
    expect(second.dataset).toMatchObject({
      kind: 'attraction',
      id: 'ferris-wheel',
      state: 'broken',
    });
    expect(second.title).toBe('attraction ferris-wheel');
    expect([...second.sandbox]).toEqual(['allow-scripts']);
  });
});

describe('the stand-in picture', () => {
  it('fills the square with its background and writes the words across its middle', async () => {
    const { drawPlaceholder } = await sandboxFrame();
    const painted: unknown[][] = [];
    const ctx = {
      set fillStyle(value: string) {
        painted.push(['fillStyle', value]);
      },
      set font(value: string) {
        painted.push(['font', value]);
      },
      set textAlign(value: string) {
        painted.push(['textAlign', value]);
      },
      fillRect: (...args: unknown[]) => painted.push(['fillRect', ...args]),
      fillText: (...args: unknown[]) => painted.push(['fillText', ...args]),
    };
    drawPlaceholder(ctx as unknown as CanvasRenderingContext2D, 80, 'snow', 'Opening…');
    expect(painted).toEqual([
      ['fillStyle', theme.colors.snow],
      ['fillRect', 0, 0, 80, 80],
      ['fillStyle', theme.colors.muted],
      ['font', canvasFont('small')],
      ['textAlign', 'center'],
      ['fillText', 'Opening…', 40, 40, 80],
    ]);
  });
});
