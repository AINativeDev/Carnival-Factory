// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { renderStory } from './build-story-view';

const list = () => document.createElement('ol');

describe('renderStory', () => {
  it('draws each step with its label, person, link, detail and when', () => {
    const story = list();
    renderStory(story, [
      {
        kind: 'asked',
        label: 'Asked for by',
        who: 'sjmaple',
        link: { href: 'https://github.com/o/r/issues/70', text: '#70' },
        detail: 'My booth: <b>spinning</b> tops',
        meta: '24 Nov 2026 · Accepted',
      },
      { kind: 'live', label: 'On the map' },
    ]);
    const asked = story.children.item(0) as HTMLElement | null;
    const live = story.children.item(1) as HTMLElement | null;
    expect(asked?.dataset.kind).toBe('asked');
    expect(asked?.querySelector('.story-label')?.textContent).toBe('Asked for by @sjmaple in #70');
    expect(asked?.querySelector<HTMLAnchorElement>('.story-person')?.href).toBe(
      'https://github.com/sjmaple',
    );
    expect(asked?.querySelector('.story-detail')?.textContent).toBe(
      'My booth: <b>spinning</b> tops',
    );
    expect(asked?.querySelector('.story-detail b')).toBeNull();
    expect(asked?.querySelector('.story-meta')?.textContent).toBe('24 Nov 2026 · Accepted');
    expect(live?.textContent).toBe('On the map');
  });

  it('links an open pull request to its preview, and never to anywhere but https', () => {
    const story = list();
    renderStory(story, [
      {
        kind: 'built',
        label: 'Being built by the factory',
        link: { href: 'javascript:alert(1)', text: '#9' },
        meta: 'Open',
        preview: 'https://p/x',
      },
    ]);
    expect(story.querySelector<HTMLAnchorElement>('.story-link')?.getAttribute('href')).toBe('#');
    expect(story.querySelector<HTMLAnchorElement>('.story-preview')?.href).toBe('https://p/x');
  });

  it('names someone without a usable login as text, and a lone preview link without a separator', () => {
    const story = list();
    renderStory(story, [
      { kind: 'made', label: 'Made by', who: 'not a login!' },
      { kind: 'built', label: 'Being built by the factory', preview: 'https://p/x' },
    ]);
    expect(story.querySelector('.story-person')).toBeNull();
    expect(story.querySelector('.story-label')?.textContent).toBe('Made by @not a login!');
    expect([...story.querySelectorAll('.story-meta')].at(0)?.textContent).toBe('Preview it');
  });

  it('replaces what was there before', () => {
    const story = list();
    renderStory(story, [{ kind: 'live', label: 'On the map' }]);
    renderStory(story, []);
    expect(story.children).toHaveLength(0);
  });
});
