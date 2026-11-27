import { describe, expect, it } from 'vitest';
import { badgePage } from './badge-page.ts';

describe('badgePage', () => {
  const site = 'https://ainativedev.github.io/Carnival-Factory/';
  // Made inside each test, so a test sees the page as the code makes it then.
  const pageNow = () =>
    badgePage(site, 'https://github.com/x/y/issues/new?template=03-elf-engineer.yml');

  it('shows every badge with a snippet that links back to the map', () => {
    const page = pageNow();
    for (const image of ['', '-bronze', '-silver', '-gold']) {
      expect(page).toContain(`src="../badges/elf-engineer${image}.svg"`);
      expect(page).toContain(`(${site}badges/elf-engineer${image}.svg)](${site})`);
    }
  });

  it('heads each badge by its tier, the plain one first, one section after another', () => {
    const page = pageNow();
    const headings = [...page.matchAll(/<h2>(.*)<\/h2>/g)].map(([, heading]) => heading);
    expect(headings).toEqual(['Elf Engineer', 'Bronze', 'Silver', 'Gold']);
    expect(page).toContain('alt="Elf Engineer" width="200"');
    expect(page).toContain('alt="Elf Engineer: silver" width="200"');
    expect(page).toContain('    </section>\n    <section>\n      <h2>Bronze</h2>');
  });

  it('has no scripts and nothing that tracks', () => {
    const page = pageNow();
    expect(page).not.toMatch(/<script/i);
    expect(page).not.toMatch(/\.svg\?/);
  });

  it('links relative to the page when the site has no address', () => {
    const relative = badgePage('', 'https://github.com/x/y/issues/new');
    expect(relative).toContain('(../badges/elf-engineer.svg)](../)');
    expect(relative).toContain('<a href="../">Visit Carnival Factory</a>');
  });
});
