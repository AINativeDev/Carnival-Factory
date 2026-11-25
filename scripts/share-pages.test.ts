import { describe, expect, it } from 'vitest';
import {
  decodeLiteral,
  escapeHtml,
  factorySharePage,
  readSquareInfo,
  sharePage,
  siteUrl,
  worldLink,
} from './share-pages';

describe('share pages', () => {
  const page = sharePage(
    { kind: 'booth', id: 'elf', name: "Santa's <Toy> Factory", description: 'Toys & "elves"' },
    'https://x.github.io/repo/share/map.png',
  );

  it('unfurls with a title, a description and the map as the image', () => {
    expect(page).toContain(
      `<meta property="og:title" content="Santa&#39;s &lt;Toy&gt; Factory, by @elf, at Carnival Factory" />`,
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

  it('sends the browser on to the world, inside the square, with no scripts', () => {
    expect(page).toContain('<meta http-equiv="refresh" content="0; url=../#/booth/elf" />');
    expect(page).toContain('<a href="../#/booth/elf">');
    expect(page).not.toMatch(/<script/i);
    expect(worldLink('attraction', 'ferris-wheel')).toBe('../#/attraction/ferris-wheel');
  });

  it('gives a square without a description a line of its own', () => {
    const bare = sharePage({ kind: 'attraction', id: 'x', name: 'X', description: '' }, 'map.png');
    expect(bare).toContain('<title>X at Carnival Factory</title>');
    expect(bare).not.toContain('by the North Pole');
    expect(bare).toContain('Visit X at Carnival Factory, and get a booth too.');
    expect(bare).toContain(
      '<meta property="og:site_name" content="Carnival Factory – Christmas edition" />',
    );
  });

  it("gives the factory's numbers a share page of their own", () => {
    const factory = factorySharePage('map.png');
    expect(factory).toContain('<title>The factory behind Carnival Factory</title>');
    expect(factory).toContain(
      '<meta property="og:title" content="The factory behind Carnival Factory" />',
    );
    expect(factory).toContain('<meta http-equiv="refresh" content="0; url=../#/factory" />');
    expect(factory).not.toMatch(/<script/i);
  });

  it("reads a square's name and description from its source", () => {
    expect(
      readSquareInfo(
        `const b = {\n  id: 'elf',\n  name: "Santa's Workshop",\n  description: 'It\\'s cosy.',\n};`,
      ),
    ).toEqual({ name: "Santa's Workshop", description: "It's cosy." });
    expect(readSquareInfo('const b = { name: computed() }')).toEqual({});
  });

  it("reads the square's own name, not an earlier object's", () => {
    const source = `const GIFTS = [{ name: 'Stocking stuffer' }];\nconst a = {\n  id: 'gift-shop',\n  name: 'Gift Shop',\n  description: 'Gifts.',\n};`;
    expect(readSquareInfo(source, 'gift-shop')).toEqual({
      name: 'Gift Shop',
      description: 'Gifts.',
    });
    // Without the id, or with one the source never sets, it reads the first.
    expect(readSquareInfo(source).name).toBe('Stocking stuffer');
    expect(readSquareInfo(source, 'elsewhere').name).toBe('Stocking stuffer');
  });

  it('decodes escapes as the square itself sees them', () => {
    const source = String.raw`const b = { name: 'Snow☃man', description: 'One\ntwo' }`;
    expect(readSquareInfo(source)).toEqual({ name: 'Snow☃man', description: 'One\ntwo' });
    expect(decodeLiteral(String.raw`\x41\u{1F384}\'\\\q`)).toBe("A🎄'\\q");
    expect(decodeLiteral('a\\\nb')).toBe('ab');
  });

  it('knows the site from SITE_URL, or from the repository on GitHub Pages', () => {
    expect(siteUrl({ SITE_URL: 'https://example.org/np' })).toBe('https://example.org/np/');
    expect(siteUrl({ SITE_URL: 'https://example.org/np/' })).toBe('https://example.org/np/');
    expect(siteUrl({ GITHUB_REPOSITORY: 'AINativeDev/Northpole' })).toBe(
      'https://ainativedev.github.io/Northpole/',
    );
    expect(siteUrl({})).toBeUndefined();
    expect(escapeHtml(`<a href="x">'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&lt;/a&gt;');
  });
});
