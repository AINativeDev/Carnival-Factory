// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { columnWidth, visitColumns } from './visit-columns';

afterEach(() => {
  document.body.replaceChildren();
});

/** A frame with its canvas and a panel whose intro sits between its top row and its story. */
function page() {
  document.body.innerHTML =
    '<div class="map-frame"><canvas></canvas><section class="visit"><div class="visit-head"></div><div class="visit-intro"></div><section class="visit-story"></section></section></div>';
  const frame = document.querySelector('.map-frame') as HTMLElement;
  const panel = frame.querySelector('.visit') as HTMLElement;
  const intro = panel.querySelector('.visit-intro') as HTMLElement;
  const canvas = frame.querySelector('canvas') as HTMLCanvasElement;
  return { frame, panel, intro, canvas };
}

const settle = () => Promise.resolve();

describe('the columns either side of a drawing', () => {
  it('are as wide as the space beside it, and none when that is too narrow', () => {
    expect(columnWidth('600,0,1200,1200', 2)).toBe(300);
    expect(columnWidth('279,0,800,800', 1)).toBe(279);
    expect(columnWidth('100,0,800,800', 1)).toBeUndefined();
    expect(columnWidth(undefined, 1)).toBeUndefined();
  });

  it('take the name and description left of the drawing while there is room, and give them back', async () => {
    const { frame, panel, intro, canvas } = page();
    const name = document.createElement('h2');
    name.tabIndex = -1;
    intro.append(name);
    name.focus();
    const columns = visitColumns(frame, panel, intro);
    expect(intro.parentElement).toBe(panel);
    canvas.dataset.stage = '300,0,800,800';
    await settle();
    expect(frame.dataset.columns).toBe('');
    canvas.dataset.stage = '320,0,760,760';
    await settle();
    expect(frame.querySelectorAll('.visit-left')).toHaveLength(1);
    expect(frame.style.getPropertyValue('--visit-column')).toBe('320px');
    expect(intro.parentElement?.className).toBe('visit-left');
    // Moving it kept the focus where it was.
    expect(document.activeElement).toBe(name);
    canvas.dataset.stage = '16,64,358,358';
    await settle();
    expect(frame.dataset.columns).toBeUndefined();
    expect(panel.children[1]).toBe(intro);
    canvas.dataset.stage = '300,0,800,800';
    await settle();
    columns.stop();
    expect(frame.querySelector('.visit-left')).toBeNull();
    expect(frame.dataset.columns).toBeUndefined();
  });

  it('reads a screen without a pixel ratio as one pixel to one', () => {
    vi.stubGlobal('devicePixelRatio', 0);
    const { frame, panel, intro, canvas } = page();
    canvas.dataset.stage = '300,0,800,800';
    visitColumns(frame, panel, intro);
    expect(frame.style.getPropertyValue('--visit-column')).toBe('300px');
    vi.unstubAllGlobals();
  });

  it('copes with a frame without a canvas', () => {
    document.body.innerHTML = '<div><section><div class="visit-intro"></div></section></div>';
    const frame = document.body.firstElementChild as HTMLElement;
    const panel = frame.firstElementChild as HTMLElement;
    visitColumns(frame, panel, panel.firstElementChild as HTMLElement).stop();
    expect(panel.children).toHaveLength(1);
  });
});
