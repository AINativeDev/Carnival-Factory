import { describe, expect, it } from 'vitest';
import {
  BOOTH_REQUEST_URL,
  keepPostedHref,
  profileUrl,
  remixUrl,
  signupNote,
  signupOffer,
} from './links';

/** The links' rules at their edges: lengths, anchors and the case of a scheme. */
const whatOf = (url: string) => new URL(url).searchParams.get('what');

describe('remixUrl, word for word', () => {
  it('pre-fills the title and the first lines, encoded after the form', () => {
    expect(remixUrl('ana', 'Penguin Pond')).toBe(
      `${BOOTH_REQUEST_URL}&title=${encodeURIComponent("My booth: a remix of @ana's booth")}` +
        `&what=${encodeURIComponent("Start from @ana's Penguin Pond, copied into my own booth and credited to @ana. Then:\n\n")}`,
    );
  });

  it('keeps a name of forty characters whole, and cuts a longer one to forty with an ellipsis', () => {
    expect(whatOf(remixUrl('ana', 'x'.repeat(40)))).toMatch(
      new RegExp(`^Start from @ana's x{40}, `),
    );
    expect(whatOf(remixUrl('ana', 'x'.repeat(41)))).toMatch(
      new RegExp(`^Start from @ana's x{39}…, `),
    );
  });

  it('squeezes the spaces in a name to one, and keeps letters beyond the basic plane whole', () => {
    expect(whatOf(remixUrl('ana', '  Penguin   \t Pond 🐧 '))).toMatch(
      /^Start from @ana's Penguin Pond 🐧, /,
    );
  });
});

describe('profileUrl, at the edges', () => {
  it('links a login of up to 39 characters, in any case', () => {
    expect(profileUrl('a'.repeat(39))).toBe(`https://github.com/${'a'.repeat(39)}`);
    expect(profileUrl('Jedi4Ever')).toBe('https://github.com/Jedi4Ever');
    expect(profileUrl('7')).toBe('https://github.com/7');
  });

  it('turns down a longer login, a hyphen at its end or two together, and anything round it', () => {
    for (const login of ['a'.repeat(40), 'ana-', 'a--b', ' ana', 'ana ', 'a_b'])
      expect(profileUrl(login), login).toBeUndefined();
  });
});

describe('keepPostedHref, as the site has it', () => {
  it('goes to the placeholder page until the form is set', () => {
    expect(keepPostedHref()).toBe('#/keep-posted');
  });
});

describe('the signup links, by their scheme', () => {
  it('takes an https link in any case, and nothing with https further in', () => {
    expect(signupOffer('HTTPS://tessl.io/signup', 'Free')).toEqual({
      url: 'HTTPS://tessl.io/signup',
      text: 'Free',
    });
    expect(signupOffer('see https://tessl.io/signup', 'Free')).toBeUndefined();
    expect(signupNote('HTTPS://tessl.io/login')).toContain('(https://tessl.io/login?utm_source=');
    expect(signupNote('see https://tessl.io/login')).toBe('');
  });

  it('stays hidden while its wording is only spaces', () => {
    expect(signupOffer('https://tessl.io/signup', '   ')).toBeUndefined();
  });
});
