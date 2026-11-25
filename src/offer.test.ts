// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { signupOffer } from './northpole/links';
import { SIGNUP_OFFER, showSignupOffer } from './offer';

const OFFER = { url: 'https://tessl.io/signup', text: '<b>Free</b> credits' };

/** A panel holding the offer's markup, the way the history and factory pages do. */
function panelWithOffer() {
  const panel = document.createElement('section');
  panel.innerHTML = SIGNUP_OFFER;
  return panel;
}

describe('the free credits offer', () => {
  it("follows the site's own offer by default, hidden while it is not set", () => {
    const panel = panelWithOffer();
    showSignupOffer(panel);
    expect(panel.querySelector<HTMLElement>('.history-offer')?.hidden).toBe(!signupOffer());
  });

  it('shows the offer as text, linking to the sign-up page, once both halves are set', () => {
    const panel = panelWithOffer();
    showSignupOffer(panel, OFFER);
    const link = panel.querySelector<HTMLAnchorElement>('.history-offer-link');
    expect(link?.href).toBe(OFFER.url);
    expect(link?.textContent).toBe('<b>Free</b> credits');
    expect(panel.querySelector('b')).toBeNull();
    expect(panel.querySelector<HTMLElement>('.history-offer')?.hidden).toBe(false);
  });

  it('leaves a panel alone that has no room for the offer, or only half of it', () => {
    const empty = document.createElement('section');
    showSignupOffer(empty, OFFER);
    expect(empty.innerHTML).toBe('');

    const boxOnly = document.createElement('section');
    boxOnly.innerHTML = '<div class="history-offer" hidden></div>';
    showSignupOffer(boxOnly, OFFER);
    expect(boxOnly.querySelector<HTMLElement>('.history-offer')?.hidden).toBe(true);
  });
});
