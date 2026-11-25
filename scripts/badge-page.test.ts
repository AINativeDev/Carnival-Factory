import { describe, expect, it } from 'vitest';
import { badgePage } from './badge-page.ts';

describe('badgePage', () => {
  const site = 'https://ainativedev.github.io/Northpole-Carnival-Factory/';
  const page = badgePage(site, 'https://github.com/x/y/issues/new?template=03-elf-engineer.yml');

  it('shows every badge with a snippet that links back to the map', () => {
    for (const image of ['', '-bronze', '-silver', '-gold']) {
      expect(page).toContain(`src="../badges/elf-engineer${image}.svg"`);
      expect(page).toContain(`(${site}badges/elf-engineer${image}.svg)](${site})`);
    }
  });

  it('has no scripts and nothing that tracks', () => {
    expect(page).not.toMatch(/<script/i);
    expect(page).not.toMatch(/\.svg\?/);
  });

  it('links relative to the page when the site has no address', () => {
    const relative = badgePage('', 'https://github.com/x/y/issues/new');
    expect(relative).toContain('(../badges/elf-engineer.svg)](../)');
    expect(relative).toContain('<a href="../">Visit Carnival Factory</a>');
  });
});
