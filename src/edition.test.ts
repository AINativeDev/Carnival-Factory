import { describe, expect, it } from 'vitest';
import { EDITION, SITE_NAME, SITE_TITLE, fillEdition } from './edition';

describe('the edition', () => {
  it('names the product, and this edition beside it', () => {
    expect(SITE_NAME).toBe('Carnival Factory');
    expect(EDITION).toBe('Christmas edition');
    expect(SITE_TITLE).toBe('Carnival Factory – Christmas edition');
  });

  it("fills a page's placeholders, every one of them", () => {
    expect(
      fillEdition(
        '<title>%SITE_TITLE%</title><a href="%REPO_URL%">%SITE_NAME% <span>%EDITION%</span></a>%SITE_NAME%',
      ),
    ).toBe(
      '<title>Carnival Factory – Christmas edition</title><a href="https://github.com/AINativeDev/Carnival-Factory">Carnival Factory <span>Christmas edition</span></a>Carnival Factory',
    );
  });
});
