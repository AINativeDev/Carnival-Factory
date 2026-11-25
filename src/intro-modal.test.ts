// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INTRO_EVENT } from './analytics-events';
import { INTRO_SEEN_KEY, startIntro, type Intro } from './intro';

/**
 * The intro stays a modal however the page around it moves
 * (docs/specs/intro.md): a scene that can't draw, the route changing under
 * it, and a walk already under way when it opens.
 */
function the(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

let told: unknown[] = [];
const listen = (event: Event) => told.push((event as CustomEvent).detail);
let intro: Intro | undefined;

function page(hash = '#/') {
  document.body.innerHTML = `
    <header class="banner"><button class="intro-open" type="button">What is this?</button></header>
    <main id="app"><canvas class="map-canvas" tabindex="0"></canvas></main>`;
  the('.map-canvas').focus();
  intro = startIntro(hash);
  return intro;
}

beforeEach(() => {
  localStorage.clear();
  told = [];
  window.addEventListener(INTRO_EVENT, listen);
});

afterEach(() => {
  intro?.stop();
  window.removeEventListener(INTRO_EVENT, listen);
  vi.restoreAllMocks();
});

describe('the intro as a modal', () => {
  it('can still be closed when its scenes fail to draw', () => {
    // A context whose every drawing call throws, like a canvas the browser couldn't allocate.
    const broken = new Proxy(
      {},
      {
        get: () => {
          throw new Error('no context');
        },
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      broken as CanvasRenderingContext2D,
    );
    expect(page().isOpen).toBe(true);
    expect(document.activeElement).toBe(the('.intro-explore'));
    the('.intro-backdrop').click();
    expect(intro?.isOpen).toBe(false);
    expect(document.querySelector('.intro-backdrop')).toBeNull();
    expect(told).toEqual(['opened', 'skip']);
  });

  it('closes when the route changes under it, leaving focus where the new page put it', () => {
    page();
    const title = document.createElement('h2');
    title.tabIndex = -1;
    document.body.append(title);
    title.focus();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(intro?.isOpen).toBe(false);
    expect(document.querySelector('.intro')).toBeNull();
    expect(localStorage.getItem(INTRO_SEEN_KEY)).toBe('1');
    expect(told).toEqual(['opened', 'skip']);
    expect(document.activeElement).toBe(title);
  });

  it('stops listening for route changes once closed', () => {
    page().close('explore');
    told = [];
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(told).toEqual([]);
  });

  it('lets go of any key the map was walking with as it opens', () => {
    const letGo = vi.fn();
    window.addEventListener('blur', letGo);
    page('#/booth/ana');
    expect(letGo).not.toHaveBeenCalled();
    intro?.open();
    window.removeEventListener('blur', letGo);
    expect(letGo).toHaveBeenCalledOnce();
  });
});
