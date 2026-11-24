import { describe, expect, it } from 'vitest';
import { keepPostedHref, signupOffer } from './links';

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
