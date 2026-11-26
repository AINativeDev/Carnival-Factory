// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { switchFlags } from './test-support/feature-flags';
import { showBoothLinks } from './visit-links';

describe("a booth's own links", () => {
  switchFlags({ remix: true, elfEngineer: true });

  it('copes with a panel that has none of them', () => {
    const card = document.createElement('section');
    expect(() => {
      showBoothLinks(card, 'booth', 'ana').remix('Cocoa');
    }).not.toThrow();
  });

  it("points Remix at the booth's name once it's known", () => {
    const card = document.createElement('section');
    card.innerHTML = '<a class="visit-remix-link"></a>';
    showBoothLinks(card, 'booth', 'ana').remix('Cocoa');
    const remix = card.querySelector<HTMLAnchorElement>('.visit-remix-link');
    expect(remix?.hidden).toBe(false);
    expect(remix?.href).toContain('Cocoa');
  });
});
