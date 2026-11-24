import { describe, expect, it } from 'vitest';
import { deepLink, parseHash, seasonLink } from './route';

describe('parseHash', () => {
  it('reads the plain map', () => {
    for (const hash of ['', '#', '#/', '#/nowhere'])
      expect(parseHash(hash)).toEqual({ view: 'map' });
  });

  it("reads a square's own page", () => {
    expect(parseHash('#/booth/jedi4ever')).toEqual({
      view: 'square',
      kind: 'booth',
      id: 'jedi4ever',
    });
    expect(parseHash('#/attraction/ferris-wheel')).toEqual({
      view: 'square',
      kind: 'attraction',
      id: 'ferris-wheel',
    });
  });

  it('keeps links from before booths were called plots', () => {
    expect(parseHash('#/plot/jedi4ever')).toEqual({ view: 'legacy', id: 'jedi4ever' });
  });

  it('reads a deep link to a booth or an attraction on the map', () => {
    expect(parseHash('#/?booth=jedi4ever')).toEqual({
      view: 'map',
      focus: { kind: 'booth', id: 'jedi4ever' },
    });
    expect(parseHash('#/?attraction=ferris-wheel')).toEqual({
      view: 'map',
      focus: { kind: 'attraction', id: 'ferris-wheel' },
    });
    expect(parseHash('#?booth=jedi4ever')).toEqual({
      view: 'map',
      focus: { kind: 'booth', id: 'jedi4ever' },
    });
  });

  it('reads a mixed-case deep link as the square it names', () => {
    expect(parseHash('#/?booth=Jedi4Ever')).toEqual({
      view: 'map',
      focus: { kind: 'booth', id: 'jedi4ever' },
    });
    expect(parseHash('#/?attraction=Ferris-Wheel')).toEqual({
      view: 'map',
      focus: { kind: 'attraction', id: 'ferris-wheel' },
    });
  });

  it('ignores a malformed name and opens the plain map', () => {
    for (const hash of [
      '#/?booth=',
      '#/?booth=<img src=x onerror=alert(1)>',
      '#/?booth=%3Cb%3E',
      '#/?attraction=../secret',
      '#/?booth=a%20b',
      '#/?colour=red',
    ]) {
      expect(parseHash(hash)).toEqual({ view: 'map' });
    }
  });

  it('reads back the deep link it makes', () => {
    expect(parseHash(deepLink('booth', 'jedi4ever'))).toEqual({
      view: 'map',
      focus: { kind: 'booth', id: 'jedi4ever' },
    });
    expect(deepLink('attraction', 'ferris-wheel')).toBe('#/?attraction=ferris-wheel');
  });
});

describe('the season card', () => {
  it("reads a participant's season card, in lower case", () => {
    expect(parseHash('#/season/Jedi4ever')).toEqual({ view: 'season', login: 'jedi4ever' });
    expect(parseHash(seasonLink('jedi4ever'))).toEqual({ view: 'season', login: 'jedi4ever' });
  });

  it('ignores a malformed login and opens the plain map', () => {
    expect(parseHash('#/season/<script>')).toEqual({ view: 'map' });
    expect(parseHash('#/season/')).toEqual({ view: 'map' });
  });
});
