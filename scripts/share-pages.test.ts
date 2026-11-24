import { describe, expect, it } from 'vitest';
import { escapeHtml, readSquareInfo, sharePage, siteUrl, worldLink } from './share-pages';

describe('share pages', () => {
  const page = sharePage(
    { kind: 'booth', id: 'elf', name: "Santa's <Toy> Factory", description: 'Toys & "elves"' },
    'https://x.github.io/repo/share/map.png',
  );

  it('unfurls with a title, a description and the map as the image', () => {
    expect(page).toContain(
      `<meta property="og:title" content="Santa&#39;s &lt;Toy&gt; Factory, by @elf, at the North Pole Carnival" />`,
    );
    expect(page).toContain(
      '<meta property="og:description" content="Toys &amp; &quot;elves&quot;" />',
    );
    expect(page).toContain(
      '<meta property="og:image" content="https://x.github.io/repo/share/map.png" />',
    );
    expect(page).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(page).toContain('<meta name="twitter:image"');
  });

  it('sends the browser on to the world with the card open, with no scripts', () => {
    expect(page).toContain('<meta http-equiv="refresh" content="0; url=../#/booth/elf" />');
    expect(page).toContain('<a href="../#/booth/elf">');
    expect(page).not.toMatch(/<script/i);
    expect(worldLink('attraction', 'ferris-wheel')).toBe('../#/attraction/ferris-wheel');
  });

  it('gives a square without a description a line of its own', () => {
    const bare = sharePage({ kind: 'attraction', id: 'x', name: 'X', description: '' }, 'map.png');
    expect(bare).toContain('by the North Pole');
    expect(bare).toContain('Visit X at the North Pole Carnival');
  });

  it("reads a square's name and description from its source", () => {
    expect(
      readSquareInfo(
        `const b = {\n  id: 'elf',\n  name: "Santa's Workshop",\n  description: 'It\\'s cosy.',\n};`,
      ),
    ).toEqual({ name: "Santa's Workshop", description: "It's cosy." });
    expect(readSquareInfo('const b = { name: computed() }')).toEqual({});
  });

  it('knows the site from SITE_URL, or from the repository on GitHub Pages', () => {
    expect(siteUrl({ SITE_URL: 'https://example.org/np' })).toBe('https://example.org/np/');
    expect(siteUrl({ GITHUB_REPOSITORY: 'AINativeDev/Northpole' })).toBe(
      'https://ainativedev.github.io/Northpole/',
    );
    expect(siteUrl({})).toBeUndefined();
    expect(escapeHtml(`<a href="x">'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&lt;/a&gt;');
  });
});
