// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SITE_NAME } from './edition';
import { openFactoryHud } from './factory';
import { HOW_IT_WORKS_URL, OWN_REPO_URL } from './northpole/links';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe("the factory's numbers page, as marked up", () => {
  it('is a labelled panel with its way back, its title, its figures and its links', () => {
    document.body.innerHTML = '<div class="map-frame"></div>';
    const frame = document.querySelector<HTMLElement>('.map-frame');
    if (!frame) throw new Error('no frame');
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    openFactoryHud(frame, {
      squares: { booths: 1, attractions: 2, people: 1 },
      onClose: () => undefined,
    });
    const card = frame.querySelector('.factory');
    expect(card?.className).toBe('hud factory');
    expect(card?.getAttribute('aria-labelledby')).toBe('factory-title');
    expect(focus.mock.calls).toEqual([[{ preventScroll: true }]]);
    const html = (card?.innerHTML ?? '')
      .replaceAll(HOW_IT_WORKS_URL, 'HOW')
      .replaceAll(OWN_REPO_URL, 'OWN')
      .replace(SITE_NAME, 'SITE')
      .replace(/\s*<div class="history-offer"[\s\S]*$/, '')
      .trim();
    expect(html).toMatchInlineSnapshot(`
      "<p class="visit-leave"><span>Esc to go back to the map</span> <button class="visit-close" type="button">Leave</button></p>
          <h2 id="factory-title" class="visit-title" tabindex="-1">The factory behind SITE</h2>
          <p class="factory-intro">Every booth here began as an issue. A software factory built it, checked it and put it on the map.</p>
          <ul class="factory-figures"><li class="factory-figure"><span class="factory-value">1</span> <span class="factory-label">booth on the map</span></li><li class="factory-figure"><span class="factory-value">2</span> <span class="factory-label">attractions</span></li><li class="factory-figure"><span class="factory-value">1</span> <span class="factory-label">person with a booth</span></li></ul>
          <p class="factory-note">The factory's builds, requests and review findings appear on the live map.</p>
          <p class="factory-how"><a href="HOW" target="_blank" rel="noopener">How it works</a> <span aria-hidden="true">·</span> <a href="OWN" target="_blank" rel="noopener">Run this on your own repo</a></p>"
    `);
  });

  it("puts each figure's detail after its label", () => {
    document.body.innerHTML = '<div class="map-frame"></div>';
    const frame = document.querySelector<HTMLElement>('.map-frame');
    if (!frame) throw new Error('no frame');
    const stats = {
      builds: 2,
      merged: 2,
      autoMerged: 1,
      requests: 3,
      accepted: 2,
      question: 1,
      declined: 0,
      findings: 4,
      fixed: 4,
      readAt: '2026-11-24T18:57:03Z',
    };
    openFactoryHud(frame, {
      squares: { booths: 0, attractions: 0, people: 0 },
      stats,
      onClose: () => undefined,
    });
    expect([...frame.querySelectorAll('.factory-figure')].at(5)?.outerHTML).toBe(
      '<li class="factory-figure"><span class="factory-value">4</span> ' +
        '<span class="factory-label">review findings</span> <span class="factory-detail">4 fixed</span></li>',
    );
  });
});
