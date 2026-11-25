import { describe, expect, it } from 'vitest';
import { BOOTH_REQUEST_URL, keepPostedHref, profileUrl, remixUrl, signupOffer } from './links';

describe('keepPostedHref', () => {
  it('goes to the placeholder page while there is no form yet', () => {
    expect(keepPostedHref('')).toBe('#/keep-posted');
  });

  it('goes straight to the form once its address is set', () => {
    expect(keepPostedHref('https://forms.example.com/north-pole')).toBe(
      'https://forms.example.com/north-pole',
    );
  });
});

describe('signupOffer', () => {
  it('stays hidden until both its link and its wording are filled in', () => {
    expect(signupOffer()).toBeUndefined();
    expect(signupOffer('https://tessl.io/signup', '')).toBeUndefined();
    expect(signupOffer('', 'Free credits')).toBeUndefined();
    expect(signupOffer('http://tessl.io/signup', 'Free credits')).toBeUndefined();
  });

  it('shows once both are set', () => {
    expect(signupOffer('https://tessl.io/signup', ' Free credits ')).toEqual({
      url: 'https://tessl.io/signup',
      text: 'Free credits',
    });
  });
});

describe('remixUrl', () => {
  it('opens the booth form, pre-filled to start from the booth', () => {
    const url = new URL(remixUrl('ana', 'Penguin Pond'));
    expect(url.href.startsWith(BOOTH_REQUEST_URL)).toBe(true);
    expect(url.searchParams.get('template')).toBe('01-your-booth.yml');
    expect(url.searchParams.get('title')).toBe("My booth: a remix of @ana's booth");
    expect(url.searchParams.get('what')).toMatch(/^Start from @ana's Penguin Pond, /);
  });

  it("keeps the booth's name to one encoded line of a set length", () => {
    const url = new URL(remixUrl('ana', `a&b=c#\n${'x'.repeat(80)}`));
    const what = url.searchParams.get('what') ?? '';
    expect(what.startsWith("Start from @ana's a&b=c# xxx")).toBe(true);
    expect(what).toContain('…,');
    expect(url.hash).toBe('');
  });

  it('survives a name with a lone surrogate', () => {
    const url = new URL(remixUrl('ana', 'Pond \uD800 \uDC00'));
    expect(url.searchParams.get('what')).toMatch(/^Start from @ana's Pond \uFFFD \uFFFD, /);
  });

  it('calls a booth with a blank name just a booth', () => {
    const url = new URL(remixUrl('ana', ' \n '));
    expect(url.searchParams.get('what')).toMatch(/^Start from @ana's booth, /);
  });
});

describe('profileUrl', () => {
  it('links a GitHub login, and nothing else', () => {
    expect(profileUrl('jedi4ever')).toBe('https://github.com/jedi4ever');
    expect(profileUrl('a-b')).toBe('https://github.com/a-b');
    expect(profileUrl('ghost/../x')).toBeUndefined();
    expect(profileUrl('-ana')).toBeUndefined();
    expect(profileUrl('')).toBeUndefined();
  });
});
