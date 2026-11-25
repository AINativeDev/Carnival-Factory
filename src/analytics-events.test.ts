import { describe, expect, it } from 'vitest';
import { BOOTH_REQUEST_URL, REPO_URL } from './northpole/links';
import { clickEvent, introEvent, routeEvent, type Clicked } from './analytics-events';

describe('routeEvent: what a visitor is looking at', () => {
  it('names each view of the map', () => {
    expect(routeEvent({ view: 'map' })).toEqual({ event: 'map_viewed', properties: {} });
    expect(routeEvent({ view: 'factory' })).toEqual({ event: 'factory_viewed', properties: {} });
    expect(routeEvent({ view: 'advent' })).toEqual({ event: 'advent_viewed', properties: {} });
  });

  it('says which square or level was opened, by its public id', () => {
    expect(routeEvent({ view: 'square', kind: 'booth', id: 'ana' })).toEqual({
      event: 'square_opened',
      properties: { kind: 'booth', id: 'ana' },
    });
    expect(routeEvent({ view: 'level', login: 'ana', inside: 'hut' })).toEqual({
      event: 'level_opened',
      properties: { level: 'ana', square: 'hut' },
    });
    expect(routeEvent({ view: 'level', login: 'ana' }).properties).toEqual({ level: 'ana' });
  });

  it('counts a shared map link to a square as the map, focused on it', () => {
    expect(routeEvent({ view: 'map', focus: { kind: 'attraction', id: 'big-top' } })).toEqual({
      event: 'map_viewed',
      properties: { kind: 'attraction', id: 'big-top' },
    });
  });

  it('counts season cards, and old links as the map', () => {
    expect(routeEvent({ view: 'season', login: 'ana' }).event).toBe('season_viewed');
    expect(routeEvent({ view: 'legacy', id: 'x' }).event).toBe('map_viewed');
  });
});

/** A clicked element, as far as clickEvent looks at it. */
const clicked = (link?: { href: string }, classes: string[] = []): Clicked => ({
  closest: (selector: string) =>
    selector === 'a[href]'
      ? (link ?? null)
      : classes.some((name) => selector.split(',').includes(`.${name}`))
        ? { className: classes.join(' ') }
        : null,
});

describe('clickEvent: what a visitor does', () => {
  it('counts a request started from the page, by which form', () => {
    expect(clickEvent(clicked({ href: BOOTH_REQUEST_URL }))).toEqual({
      event: 'request_started',
      properties: { form: '01-your-booth.yml' },
    });
  });

  it('counts sharing and a visit to the repository', () => {
    expect(clickEvent(clicked(undefined, ['visit-copy']))?.event).toBe('share_copied');
    expect(clickEvent(clicked({ href: REPO_URL }, ['repo-link']))?.event).toBe('repo_opened');
  });

  it('ignores every other click', () => {
    expect(clickEvent(clicked({ href: 'https://example.com' }))).toBeUndefined();
    expect(clickEvent(clicked())).toBeUndefined();
  });
});

describe('introEvent: the first-visit intro', () => {
  it('counts it opening, and how it closed', () => {
    expect(introEvent('opened')).toEqual({ event: 'intro_opened', properties: {} });
    for (const how of ['skip', 'explore', 'build'])
      expect(introEvent(how)).toEqual({ event: 'intro_closed', properties: { how } });
  });

  it('ignores anything else', () => {
    expect(introEvent('closed')).toBeUndefined();
    expect(introEvent({ how: 'skip' })).toBeUndefined();
  });
});
