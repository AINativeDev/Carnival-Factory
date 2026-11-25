// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { REPO_URL } from './northpole/links';
import { renderKeepPosted } from './keep-posted';

describe('the "keep me posted" page', () => {
  it('says the list opens soon, collects nothing, and links to the repository', () => {
    const app = document.createElement('main');
    renderKeepPosted(app);
    expect(document.body.dataset.view).toBe('booth');
    expect(app.querySelector('h1')?.textContent).toBe('Keep me posted');
    expect(app.querySelector('form, input')).toBeNull();
    expect(app.querySelector<HTMLAnchorElement>('.booth-help a')?.href).toBe(REPO_URL);
  });
});
